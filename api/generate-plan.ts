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
  if (entry.count >= 20) { // max 20 requests per minute
    return false;
  }
  entry.count += 1;
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  if (!checkRateLimit(clientIp)) {
    // Return demo fallback rather than harsh 429
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
      return res.status(400).json({ success: false, error: parsedInput.error.errors[0]?.message });
    }

    const provider = process.env.LLM_PROVIDER || 'gemini';
    const hasKey = Boolean(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);

    // If no API key configured on serverless environment, immediately provide high-fidelity demo data safely
    if (!hasKey) {
      return res.status(200).json({
        success: true,
        isDemo: true,
        data: generateLocalSectionData(section, parsedInput.data),
        notice: 'Demo mode active: Zero API setup needed.',
      });
    }

    const prompt = `Plan the "${section}" section for event:
Name: ${parsedInput.data.name}
Type: ${parsedInput.data.eventType}
City: ${parsedInput.data.city}
Guests: ${parsedInput.data.guests}
Budget: ${parsedInput.data.currency} ${parsedInput.data.budget}
Theme: ${parsedInput.data.theme}
Dietary: ${parsedInput.data.dietary.join(', ')}
Accessibility: ${parsedInput.data.accessibility.join(', ')}
Cultural: ${parsedInput.data.culturalPreferences}
Special: ${parsedInput.data.specialRequests}`;

    let schemaDescription = '';
    if (section === 'concept') {
      schemaDescription = `{"tagline": string, "decor": [{"title": string, "description": string, "estCostSharePercent": number, "items": string[]}], "food": {"title": string, "description": string, "highlights": string[], "dietaryAccommodations": string}, "entertainment": {"title": string, "description": string, "scheduleSuggestion": string, "highlights": string[]}, "activities": [{"title": string, "description": string, "targetAudience": string}]}`;
    } else if (section === 'budget') {
      schemaDescription = `{"lines": [{"category": string, "item": string, "allocatedAmount": number, "actualAmount": 0, "percentage": number, "isCheaperAlternativeAvailable": boolean, "cheaperAlternativeNote": string, "potentialSavings": number}]}`;
    } else if (section === 'timeline') {
      schemaDescription = `{"tasks": [{"title": string, "category": string, "dueOffsetDays": number, "priority": "high"|"medium"|"low", "notes": string}], "daySchedule": [{"time": string, "activity": string, "owner": string, "notes": string}]}`;
    } else if (section === 'vendors') {
      schemaDescription = `{"vendors": [{"serviceType": string, "estCostRange": string, "questionsToAsk": string[]}], "expertTips": string[], "weatherPlanB": {"riskAssessment": string, "contingencySteps": string[], "backupVenuesOrGear": string[]}}`;
    }

    try {
      const rawOutput = await callLLMProvider(prompt, schemaDescription, { provider });
      const json = JSON.parse(rawOutput);
      return res.status(200).json({ success: true, isDemo: false, data: json });
    } catch (llmErr) {
      // Fallback safely to demo data
      return res.status(200).json({
        success: true,
        isDemo: true,
        data: generateLocalSectionData(section, parsedInput.data),
        notice: 'LLM call fallback; safe demo plan loaded.',
      });
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
