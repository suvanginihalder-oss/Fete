import type { VercelRequest, VercelResponse } from "@vercel/node";
import { callLLMProvider } from "../src/lib/ai/providerAdapter.js";

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

/** Strip markdown fences */
function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/** Fallback rule-based response when AI is unavailable */
function fallbackResponse(message: string, plan: any): any {
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
    const { message, plan } = req.body;
    if (!message) {
      return res
        .status(400)
        .json({ success: false, error: "Message is required" });
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
      const fallback = fallbackResponse(message, plan);
      return res
        .status(200)
        .json({ success: true, isDemo: true, data: fallback });
    }

    // Build context from plan
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
- Budget lines: ${JSON.stringify(plan.budget?.lines?.slice(0, 5) || [])}
- Key tasks: ${JSON.stringify(plan.timeline?.tasks?.slice(0, 5) || [])}
`
      : "No event plan loaded.";

    const userPrompt = `${planSummary}\n\nUSER MESSAGE: ${message}`;

    try {
      const rawOutput = await callLLMProvider(userPrompt, CHAT_SYSTEM_PROMPT, {
        provider,
        isChat: true,
      });

      const cleaned = stripFences(rawOutput);
      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // If AI returned prose instead of JSON, wrap it
        parsed = { reply: cleaned || rawOutput, suggestedAction: null };
      }

      return res
        .status(200)
        .json({ success: true, isDemo: false, data: parsed });
    } catch (llmErr: any) {
      console.error("[CelebrAI/chat] LLM error:", llmErr?.message);
      const fallback = fallbackResponse(message, plan);
      return res
        .status(200)
        .json({ success: true, isDemo: true, data: fallback });
    }
  } catch (err: any) {
    console.error("[CelebrAI/chat] Handler error:", err?.message);
    return res
      .status(500)
      .json({ success: false, error: err.message || "Chat error" });
  }
}
