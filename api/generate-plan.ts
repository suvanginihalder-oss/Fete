import type { VercelRequest, VercelResponse } from '@vercel/node';
import { callLLMProvider } from '../src/lib/ai/providerAdapter';
import { generateLocalSectionData } from '../src/lib/ai/providerAdapter';
import { eventFormSchema } from '../src/lib/schemas';

// In-memory rate limiting map per IP
const ipRateMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateMap.get(ip);
  if (!entry || entry.expiresAt < now) {
    ipRateMap.set(ip, { count: 1, expiresAt: now + 60000 });
    return true;
  }
  if (entry.count >= 30) { // max 30 requests per minute per IP
    return false;
  }
  entry.count += 1;
  return true;
}

/** Strip markdown fences that Gemini sometimes wraps JSON in despite JSON mode */
function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
    || req.socket.remoteAddress
    || '127.0.0.1';

  if (!checkRateLimit(clientIp)) {
    console.warn(`[CelebrAI] Rate limit hit for IP: ${clientIp}`);
    return res.status(200).json({
      success: true,
      isDemo: true,
      data: generateLocalSectionData(req.body.section, req.body.input),
      notice: 'Rate limit reached. Delivered sample plan safely.',
    });
  }

  try {
    const { section, input } = req.body;

    if (!section || !input) {
      return res.status(400).json({ success: false, error: 'Missing section or input' });
    }

    const parsedInput = eventFormSchema.safeParse(input);
    if (!parsedInput.success) {
      console.error('[CelebrAI] Input validation failed:', parsedInput.error.errors);
      return res.status(400).json({ success: false, error: parsedInput.error.errors[0]?.message });
    }

    const provider = (process.env.LLM_PROVIDER || process.env.AI_PROVIDER || 'gemini').toLowerCase();
    const hasKey = Boolean(
      process.env.GEMINI_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.OPENAI_API_KEY
    );

    console.log(`[CelebrAI] Section: ${section}, Provider: ${provider}, HasKey: ${hasKey}`);

    // If no API key configured, provide demo data
    if (!hasKey) {
      console.warn('[CelebrAI] No API key found. Running in demo mode.');
      return res.status(200).json({
        success: true,
        isDemo: true,
        data: generateLocalSectionData(section, parsedInput.data),
        notice: 'Demo mode active: Configure GEMINI_API_KEY in Vercel environment variables.',
      });
    }

    const evt = parsedInput.data;
    const prompt = buildPrompt(section, evt);
    const schemaDescription = getSectionSchema(section);

    try {
      const rawOutput = await callLLMProvider(prompt, schemaDescription, { provider });
      const cleaned = stripMarkdownFences(rawOutput);
      console.log(`[CelebrAI] Raw AI output for ${section} (first 300 chars):`, cleaned.slice(0, 300));

      let json: any;
      try {
        json = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error(`[CelebrAI] JSON parse failed for section ${section}:`, parseErr, '\nRaw:', cleaned.slice(0, 500));
        throw new Error(`AI returned non-JSON output for section: ${section}`);
      }

      return res.status(200).json({ success: true, isDemo: false, data: json });
    } catch (llmErr: any) {
      console.error(`[CelebrAI] LLM call failed for section ${section}:`, llmErr?.message || llmErr);
      // Fallback safely to demo data, but signal that this was a real error
      return res.status(200).json({
        success: true,
        isDemo: true,
        data: generateLocalSectionData(section, parsedInput.data),
        notice: `AI error: ${llmErr?.message?.slice(0, 120) || 'Unknown error'}. Showing sample plan.`,
      });
    }
  } catch (err: any) {
    console.error('[CelebrAI] Unexpected handler error:', err?.message || err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}

function buildPrompt(section: string, evt: any): string {
  return `Generate the "${section}" section for an event with these details:
Event Type: ${evt.eventType}
Event Name: ${evt.name}
Date: ${evt.date}
City: ${evt.city}
Guest Count: ${evt.guests}
Total Budget: ${evt.currency} ${evt.budget}
Theme/Vibe: ${evt.theme || 'Festive Elegance'}
Dietary Requirements: ${evt.dietary?.join(', ') || 'None specified'}
Accessibility Needs: ${evt.accessibility?.join(', ') || 'None specified'}
Cultural Preferences: ${evt.culturalPreferences || 'None specified'}
Special Requests: ${evt.specialRequests || 'None'}`;
}

function getSectionSchema(section: string): string {
  switch (section) {
    case 'concept':
      return JSON.stringify({
        tagline: "string - catchy event tagline",
        decor: [{
          title: "string",
          description: "string",
          estCostSharePercent: "number 0-100",
          items: ["string"]
        }],
        food: {
          title: "string",
          description: "string",
          highlights: ["string"],
          dietaryAccommodations: "string"
        },
        entertainment: {
          title: "string",
          description: "string",
          scheduleSuggestion: "string",
          highlights: ["string"]
        },
        activities: [{
          title: "string",
          description: "string",
          targetAudience: "string"
        }]
      });

    case 'budget':
      return JSON.stringify({
        lines: [{
          category: "string e.g. Catering",
          item: "string e.g. Food & Beverages",
          allocatedAmount: "integer - must sum to total budget",
          actualAmount: 0,
          percentage: "number 0-100",
          isCheaperAlternativeAvailable: "boolean",
          cheaperAlternativeNote: "string",
          potentialSavings: "integer"
        }]
      });

    case 'timeline':
      return JSON.stringify({
        tasks: [{
          title: "string",
          category: "string e.g. Venue, Catering, Decor",
          dueOffsetDays: "negative integer = days BEFORE the event (e.g. -30 means 30 days before). 0 = event day.",
          priority: "high | medium | low",
          notes: "string"
        }],
        daySchedule: [{
          time: "string e.g. 09:00 AM",
          activity: "string",
          owner: "string e.g. Event Coordinator",
          notes: "string"
        }]
      });

    case 'vendors':
      return JSON.stringify({
        vendors: [{
          serviceType: "string e.g. Catering",
          estCostRange: "string e.g. ₹15,000 - ₹25,000",
          questionsToAsk: ["string"]
        }],
        expertTips: ["string"],
        weatherPlanB: {
          riskAssessment: "string",
          contingencySteps: ["string"],
          backupVenuesOrGear: ["string"]
        }
      });

    default:
      return '{}';
  }
}
