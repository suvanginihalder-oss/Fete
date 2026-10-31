import type { VercelRequest, VercelResponse } from "@vercel/node";
import { callLLMProvider } from "../src/lib/ai/providerAdapter";
import { generateLocalSectionData } from "../src/lib/ai/providerAdapter";
import { eventFormSchema } from "../src/lib/schemas";

// In-memory rate limiting: max 30 req / minute per IP
const ipRateMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateMap.get(ip);
  if (!entry || entry.expiresAt < now) {
    ipRateMap.set(ip, { count: 1, expiresAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 30) return false;
  entry.count += 1;
  return true;
}

/** Remove markdown fences Gemini occasionally wraps around JSON */
function stripFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/** Diagnose a caught error into a short human-readable string */
function diagnose(err: any): string {
  const msg: string = (err?.message || String(err)).toLowerCase();
  if (msg.includes("429") || msg.includes("quota") || msg.includes("rate"))
    return "rate_limited";
  if (
    msg.includes("timeout") ||
    msg.includes("abort") ||
    msg.includes("timed out")
  )
    return "timeout";
  if (
    msg.includes("api key") ||
    msg.includes("api_key") ||
    msg.includes("invalid key") ||
    msg.includes("authentication")
  )
    return "auth_error";
  if (msg.includes("json") || msg.includes("parse") || msg.includes("syntax"))
    return "json_parse_error";
  if (msg.includes("validation") || msg.includes("zod"))
    return "validation_error";
  if (
    msg.includes("network") ||
    msg.includes("econnrefused") ||
    msg.includes("fetch")
  )
    return "network_error";
  return `ai_error: ${(err?.message || "").slice(0, 80)}`;
}

/** Sleep for ms milliseconds */
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Call Gemini with one automatic retry on 429 (exponential backoff) */
async function callWithRetry(
  prompt: string,
  schema: string,
  config: { provider: string },
  attempt = 0,
): Promise<string> {
  try {
    return await callLLMProvider(prompt, schema, config);
  } catch (err: any) {
    const reason = diagnose(err);
    if (reason === "rate_limited" && attempt < 2) {
      const wait = 1500 * Math.pow(2, attempt); // 1.5s → 3s
      console.warn(
        `[CelebrAI] Rate limited on attempt ${attempt + 1}, retrying in ${wait}ms…`,
      );
      await sleep(wait);
      return callWithRetry(prompt, schema, config, attempt + 1);
    }
    throw err;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  const clientIp =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "127.0.0.1";

  if (!checkRateLimit(clientIp)) {
    const failReason = "rate_limited (server-side per-IP cap)";
    console.warn(`[CelebrAI] IP rate limit hit: ${clientIp}`);
    return res.status(200).json({
      success: true,
      isDemo: true,
      failReason,
      data: generateLocalSectionData(req.body?.section, req.body?.input),
      notice: failReason,
    });
  }

  try {
    const { section, input } = req.body ?? {};

    if (!section || !input) {
      return res
        .status(400)
        .json({ success: false, error: "Missing section or input" });
    }

    const parsedInput = eventFormSchema.safeParse(input);
    if (!parsedInput.success) {
      const msg =
        parsedInput.error.errors[0]?.message ?? "Input validation failed";
      console.error(
        "[CelebrAI] Input validation failed:",
        parsedInput.error.errors,
      );
      return res.status(400).json({ success: false, error: msg });
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

    console.log(
      `[CelebrAI] section=${section} provider=${provider} hasKey=${hasKey}`,
    );

    if (!hasKey) {
      const failReason = "no_api_key: set GEMINI_API_KEY in Vercel env vars";
      console.warn("[CelebrAI] No API key configured.");
      return res.status(200).json({
        success: true,
        isDemo: true,
        failReason,
        data: generateLocalSectionData(section, parsedInput.data),
        notice: failReason,
      });
    }

    const evt = parsedInput.data;
    const prompt = buildPrompt(section, evt);
    const schema = getSectionSchema(section);

    try {
      const rawOutput = await callWithRetry(prompt, schema, { provider });
      const cleaned = stripFences(rawOutput);

      console.log(
        `[CelebrAI] ${section} raw (first 300):`,
        cleaned.slice(0, 300),
      );

      let json: any;
      try {
        json = JSON.parse(cleaned);
      } catch (parseErr: any) {
        const failReason = `json_parse_error: ${parseErr?.message?.slice(0, 60)}`;
        console.error(
          `[CelebrAI] ${section} JSON parse failed:`,
          parseErr,
          "\nRaw:",
          cleaned.slice(0, 400),
        );
        return res.status(200).json({
          success: true,
          isDemo: true,
          failReason,
          data: generateLocalSectionData(section, parsedInput.data),
          notice: failReason,
        });
      }

      // Success — return live AI data
      return res.status(200).json({ success: true, isDemo: false, data: json });
    } catch (llmErr: any) {
      const failReason = diagnose(llmErr);
      console.error(
        `[CelebrAI] ${section} LLM error (${failReason}):`,
        llmErr?.message,
      );
      return res.status(200).json({
        success: true,
        isDemo: true,
        failReason,
        data: generateLocalSectionData(section, parsedInput.data),
        notice: `${section}: ${failReason}`,
      });
    }
  } catch (err: any) {
    console.error("[CelebrAI] Unexpected handler error:", err?.message);
    return res
      .status(500)
      .json({ success: false, error: err.message || "Internal server error" });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPrompt(section: string, evt: any): string {
  return `Generate the "${section}" section for this event:
Type: ${evt.eventType}
Name: ${evt.name}
Date: ${evt.date}
City: ${evt.city}
Guests: ${evt.guests}
Total Budget: ${evt.currency}${evt.budget}
Theme: ${evt.theme || "Festive Elegance"}
Dietary: ${evt.dietary?.join(", ") || "None specified"}
Accessibility: ${evt.accessibility?.join(", ") || "None specified"}
Cultural preferences: ${evt.culturalPreferences || "None"}
Special requests: ${evt.specialRequests || "None"}`;
}

function getSectionSchema(section: string): string {
  switch (section) {
    case "concept":
      return `{
  "tagline": "string",
  "decor": [{"title":"string","description":"string","estCostSharePercent":10,"items":["string"]}],
  "food": {"title":"string","description":"string","highlights":["string"],"dietaryAccommodations":"string"},
  "entertainment": {"title":"string","description":"string","scheduleSuggestion":"string","highlights":["string"]},
  "activities": [{"title":"string","description":"string","targetAudience":"string"}]
}`;

    case "budget":
      return `{
  "lines": [
    {
      "category": "string (e.g. Catering)",
      "item": "string",
      "allocatedAmount": 12000,
      "actualAmount": 0,
      "percentage": 24,
      "isCheaperAlternativeAvailable": true,
      "cheaperAlternativeNote": "string",
      "potentialSavings": 2000
    }
  ]
}
CRITICAL: allocatedAmount values must be integers. All allocatedAmount values must sum exactly to the total budget of ${0}.`;

    case "timeline":
      return `{
  "tasks": [
    {
      "title": "string",
      "category": "string",
      "dueOffsetDays": -30,
      "priority": "high",
      "notes": "string"
    }
  ],
  "daySchedule": [
    {"time": "09:00 AM", "activity": "string", "owner": "string", "notes": "string"}
  ]
}
IMPORTANT: dueOffsetDays must be NEGATIVE integers (days before the event). E.g. -30 means 30 days before. 0 = event day. Generate at least 8 tasks and 6 day-of schedule items.`;

    case "vendors":
      return `{
  "vendors": [
    {"serviceType":"string","estCostRange":"string","questionsToAsk":["string","string"]}
  ],
  "expertTips": ["string", "string", "string"],
  "weatherPlanB": {
    "riskAssessment": "string",
    "contingencySteps": ["string"],
    "backupVenuesOrGear": ["string"]
  }
}`;

    default:
      return "{}";
  }
}
