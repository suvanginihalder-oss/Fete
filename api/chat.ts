import type { VercelRequest, VercelResponse } from "@vercel/node";
import { callLLMProvider } from "../src/lib/ai/providerAdapter.js";
import { getErrorMessage, stripFences } from "../src/lib/ai/jsonUtils.js";

const MAX_MESSAGE_LENGTH = 1000;

const CHAT_SYSTEM_PROMPT = `You are EventCraft AI, an expert event planning assistant with deep knowledge of weddings, birthdays, anniversaries, college fests, and community events. You have full context of the user's event plan. 

When responding:
1. Be concise, warm, and actionable.
2. If the user asks for a budget change, propose a specific JSON suggestedAction with type "modify_budget".
3. If the user asks to add a task, propose a JSON suggestedAction with type "add_task".
4. Always respond in this exact JSON format:
{
  "reply": "Your helpful response text here",
  "suggestedAction": null
}
OR with an action:
{
  "reply": "Your helpful response text here",
  "suggestedAction": {
    "type": "modify_budget",
    "label": "Short action label",
    "diffSummary": "What this change does",
    "applyPayload": {
      "categoryAdjustments": [{"categoryMatch": "string", "delta": number}]
    }
  }
}
OR for task:
{
  "reply": "Your helpful response text here",
  "suggestedAction": {
    "type": "add_task",
    "label": "Short label",
    "diffSummary": "What task is added",
    "applyPayload": {
      "task": {"title": "string", "category": "string", "dueOffsetDays": -7, "priority": "high|medium|low", "notes": "string"}
    }
  }
}
Respond ONLY with valid JSON. No markdown, no prose outside the JSON.`;

/** The parts of the saved plan that the chat assistant reads. */
interface ChatPlanContext {
  input?: {
    name?: string;
    eventType?: string;
    date?: string;
    city?: string;
    guests?: number;
    currency?: string;
    budget?: number;
    theme?: string;
  };
  budget?: { lines?: unknown[] };
  timeline?: unknown[];
}

interface ChatReply {
  reply: string;
  suggestedAction: Record<string, unknown> | null;
}

/** Accept a model reply only if it has the expected shape. */
function toChatReply(value: unknown): ChatReply | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as { reply?: unknown; suggestedAction?: unknown };
  if (typeof candidate.reply !== "string") return null;
  const action =
    typeof candidate.suggestedAction === "object" &&
    candidate.suggestedAction !== null
      ? (candidate.suggestedAction as Record<string, unknown>)
      : null;
  return { reply: candidate.reply, suggestedAction: action };
}

/** Fallback rule-based response when AI is unavailable */
function fallbackResponse(
  message: string,
  plan: ChatPlanContext | undefined,
): ChatReply {
  const lower = message.toLowerCase();
  const currency = plan?.input?.currency || "₹";
  const city = plan?.input?.city || "your city";
  const name = plan?.input?.name || "your event";
  const guests = plan?.input?.guests || "your guests";

  if (
    lower.includes("budget") ||
    lower.includes("save") ||
    lower.includes("cost") ||
    lower.includes("cheaper")
  ) {
    return {
      reply: `I analyzed your event budget. We can optimize the Catering & Decor line items. By switching to curated live stations and leveraging in-house audio equipment, we can save approximately ${currency} 8,000 without reducing guest satisfaction.`,
      suggestedAction: {
        type: "modify_budget",
        label: `Apply ${currency} 8,000 Budget Optimization`,
        diffSummary:
          "Reduces Food (-5,000) & Decor (-3,000), increasing Emergency Buffer (+8,000)",
        applyPayload: {
          categoryAdjustments: [
            { categoryMatch: "Food", delta: -5000 },
            { categoryMatch: "Decor", delta: -3000 },
            { categoryMatch: "Emergency", delta: 8000 },
          ],
        },
      },
    };
  }

  if (
    lower.includes("rain") ||
    lower.includes("weather") ||
    lower.includes("plan b")
  ) {
    return {
      reply: `I have drafted an enhanced Weather Plan B for ${city}. This includes booking an indoor pre-function hallway buffer and scheduling a weather alert check 36 hours prior to setup.`,
      suggestedAction: {
        type: "add_task",
        label: "Add 36-Hour Weather Check Task",
        diffSummary:
          'Adds high-priority task: "Execute Rain Check & Hall Transition Standby"',
        applyPayload: {
          task: {
            title: "Execute Rain Check & Hall Transition Standby",
            category: "Safety",
            dueOffsetDays: -2,
            priority: "high",
            notes:
              "Contact venue manager to confirm dry storage for electrical fixtures.",
          },
        },
      },
    };
  }

  return {
    reply: `Great consideration for "${name}". Based on your ${guests} guests in ${city}, I recommend locking in key vendor deliverables and reviewing dietary accommodations early. Would you like me to find cost reductions in your budget lines or adjust your day schedule?`,
    suggestedAction: null,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const { message, plan } = (req.body ?? {}) as {
      message?: unknown;
      plan?: ChatPlanContext;
    };

    if (typeof message !== "string" || !message.trim()) {
      return res
        .status(400)
        .json({ success: false, error: "Message is required" });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        success: false,
        error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`,
      });
    }

    const provider = (
      process.env.LLM_PROVIDER ||
      process.env.AI_PROVIDER ||
      "gemini"
    ).toLowerCase();
    const hasKey = Boolean(
      process.env.GEMINI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.OPENAI_API_KEY,
    );

    if (!hasKey) {
      console.warn("[CelebrAI/chat] No API key found. Using fallback chat.");
      return res.status(200).json({
        success: true,
        isDemo: true,
        data: fallbackResponse(message, plan),
      });
    }

    // Build context from the plan. The saved plan stores the timeline as an array of tasks.
    const planSummary = plan
      ? `
EVENT CONTEXT:
- Name: ${plan.input?.name}
- Type: ${plan.input?.eventType}
- Date: ${plan.input?.date}
- City: ${plan.input?.city}
- Guests: ${plan.input?.guests}
- Budget: ${plan.input?.currency} ${plan.input?.budget}
- Theme: ${plan.input?.theme}
- Budget lines: ${JSON.stringify(plan.budget?.lines?.slice(0, 5) ?? [])}
- Key tasks: ${JSON.stringify(Array.isArray(plan.timeline) ? plan.timeline.slice(0, 5) : [])}
`
      : "No event plan loaded.";

    const userPrompt = `${planSummary}\n\nUSER MESSAGE: ${message}`;

    try {
      const rawOutput = await callLLMProvider(userPrompt, CHAT_SYSTEM_PROMPT, {
        provider,
        isChat: true,
      });

      const cleaned = stripFences(rawOutput);
      let reply: ChatReply;
      try {
        reply = toChatReply(JSON.parse(cleaned)) ?? {
          reply: cleaned || rawOutput,
          suggestedAction: null,
        };
      } catch {
        // If the AI returned prose instead of JSON, wrap it
        reply = { reply: cleaned || rawOutput, suggestedAction: null };
      }

      return res
        .status(200)
        .json({ success: true, isDemo: false, data: reply });
    } catch (llmErr: unknown) {
      console.error("[CelebrAI/chat] LLM error:", getErrorMessage(llmErr));
      return res.status(200).json({
        success: true,
        isDemo: true,
        data: fallbackResponse(message, plan),
      });
    }
  } catch (err: unknown) {
    const errorMsg = getErrorMessage(err);
    console.error("[CelebrAI/chat] Handler error:", errorMsg);
    return res
      .status(500)
      .json({ success: false, error: errorMsg || "Chat error" });
  }
}
