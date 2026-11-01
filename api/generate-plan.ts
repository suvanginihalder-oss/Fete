import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { z } from "zod";
import type { SectionKey } from "../src/types";
import {
  callLLMProvider,
  generateLocalSectionData,
} from "../src/lib/ai/providerAdapter.js";
import { getErrorMessage, stripFences } from "../src/lib/ai/jsonUtils.js";
import { eventFormSchema } from "../src/lib/schemas.js";

type EventFormData = z.infer<typeof eventFormSchema>;

type RateLimitEntry = {
  count: number;
  expiresAt: number;
};

const SECTION_KEYS: readonly string[] = [
  "concept",
  "budget",
  "timeline",
  "vendors",
];

function isSectionKey(value: unknown): value is SectionKey {
  return typeof value === "string" && SECTION_KEYS.includes(value);
}

// In-memory rate limiting: max 30 req / minute per IP with memory-leak cleanup
const ipRateMap = new Map<string, RateLimitEntry>();
const MAX_RATE_LIMIT_ENTRIES = 500;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // Housekeeping: prevent memory leak by purging expired keys when map grows
  if (ipRateMap.size > MAX_RATE_LIMIT_ENTRIES) {
    for (const [key, entry] of ipRateMap.entries()) {
      if (entry.expiresAt < now) {
        ipRateMap.delete(key);
      }
    }
  }

  const entry = ipRateMap.get(ip);
  if (!entry || entry.expiresAt < now) {
    ipRateMap.set(ip, { count: 1, expiresAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 30) return false;
  entry.count += 1;
  return true;
}

/** Diagnose a caught error into a short standardized string */
function diagnose(err: unknown): string {
  const msg = getErrorMessage(err).toLowerCase();
  if (/\b429\b|quota|rate[\s_-]?limit|resource_exhausted/.test(msg))
    return "rate_limited";
  if (/timeout|timed out|abort/.test(msg)) return "timeout";
  if (
    /\b40[13]\b|api key|api_key|invalid key|authentication|unauthenticated|permission/.test(
      msg,
    )
  )
    return "auth_error";
  if (/\b404\b|not found|no longer available|not supported/.test(msg))
    return "model_error";
  if (/json|parse|syntax/.test(msg)) return "json_parse_error";
  if (/validation|zod/.test(msg)) return "validation_error";
  if (/network|econnrefused|fetch/.test(msg)) return "network_error";
  return `ai_error: ${msg.slice(0, 80)}`;
}

/** Sleep for ms milliseconds */
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Call the provider with automatic retries on rate limits (exponential backoff) */
async function callWithRetry(
  prompt: string,
  schema: string,
  config: { provider: string },
  attempt = 0,
): Promise<string> {
  try {
    return await callLLMProvider(prompt, schema, config);
  } catch (err: unknown) {
    const reason = diagnose(err);
    if (reason === "rate_limited" && attempt < 2) {
      const wait = 1500 * Math.pow(2, attempt); // 1.5s → 3s
      console.warn(
        `[CelebrAI] Rate limited on attempt ${attempt + 1}, retrying in ${wait}ms`,
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

  try {
    const { section, input } = (req.body ?? {}) as {
      section?: unknown;
      input?: unknown;
    };

    if (!isSectionKey(section) || !input) {
      return res
        .status(400)
        .json({ success: false, error: "Missing or invalid section or input" });
    }

    const parsedInput = eventFormSchema.safeParse(input);
    if (!parsedInput.success) {
      const msg =
        parsedInput.error.errors[0]?.message ?? "Input validation failed";
      console.error("[CelebrAI] Input validation failed:", msg);
      return res.status(400).json({ success: false, error: msg });
    }
    const evt = parsedInput.data;

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
        data: generateLocalSectionData(section, evt),
        notice: failReason,
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
      const failReason = "no_api_key: set GEMINI_API_KEY in Vercel env vars";
      console.warn("[CelebrAI] No API key configured.");
      return res.status(200).json({
        success: true,
        isDemo: true,
        failReason,
        data: generateLocalSectionData(section, evt),
        notice: failReason,
      });
    }

    const prompt = buildPrompt(section, evt);
    const schema = getSectionSchema(section, evt);

    try {
      const rawOutput = await callWithRetry(prompt, schema, { provider });
      const cleaned = stripFences(rawOutput);

      let parsedData: unknown;
      try {
        parsedData = JSON.parse(cleaned);
      } catch (parseErr: unknown) {
        const failReason = `json_parse_error: ${getErrorMessage(parseErr).slice(0, 60)}`;
        console.error(`[CelebrAI] ${section} ${failReason}`);
        return res.status(200).json({
          success: true,
          isDemo: true,
          failReason,
          data: generateLocalSectionData(section, evt),
          notice: failReason,
        });
      }

      // Success — return live AI data
      return res
        .status(200)
        .json({ success: true, isDemo: false, data: parsedData });
    } catch (llmErr: unknown) {
      const failReason = diagnose(llmErr);
      console.error(
        `[CelebrAI] ${section} LLM error (${failReason}):`,
        getErrorMessage(llmErr),
      );
      return res.status(200).json({
        success: true,
        isDemo: true,
        failReason,
        data: generateLocalSectionData(section, evt),
        notice: `${section}: ${failReason}`,
      });
    }
  } catch (err: unknown) {
    const errorMsg = getErrorMessage(err);
    console.error("[CelebrAI] Unexpected handler error:", errorMsg);
    return res
      .status(500)
      .json({ success: false, error: errorMsg || "Internal server error" });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPrompt(section: string, evt: EventFormData): string {
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

function getSectionSchema(section: string, evt: EventFormData): string {
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
CRITICAL: allocatedAmount values must be integers. All allocatedAmount values must sum exactly to the total budget of ${evt.budget}.`;

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
