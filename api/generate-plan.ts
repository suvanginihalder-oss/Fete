import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  callGeminiJson,
  generateDeterministicPlanFallback,
} from "../src/lib/ai/geminiAdapter.js";
import { checkRateLimit, getCached, setCached } from "../src/lib/rateLimit.js";
import {
  HouseholdProfileSchema,
  PersonalizedPlanSchema,
} from "../src/types/index.js";
import type { HouseholdProfile, PersonalizedPlan } from "../src/types/index.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const clientIp =
    (req.headers["x-forwarded-for"] as string) ||
    req.socket.remoteAddress ||
    "127.0.0.1";
  const { allowed } = checkRateLimit(clientIp, 10, 60000);
  if (!allowed) {
    return res.status(429).json({
      error: "Plan generation rate limit reached. Please wait 60 seconds.",
    });
  }

  let profile: HouseholdProfile;
  let aqi: number;
  let band: string;
  let pm25: number;

  try {
    const body = req.body || {};
    profile = HouseholdProfileSchema.parse(body.profile);
    aqi = typeof body.aqi === "number" ? body.aqi : 250;
    band = typeof body.band === "string" ? body.band : "Poor";
    pm25 = typeof body.pm25 === "number" ? body.pm25 : 120;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Invalid request payload";
    return res.status(400).json({ error: msg });
  }

  // 30 minute cache key
  const profileHash = `${profile.city}_${band}_${profile.members.sort().join("-")}_${profile.commuteMode}`;
  const cacheKey = `plan_${profileHash}`;
  const cached = getCached<PersonalizedPlan>(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  // Check if GEMINI_API_KEY is configured
  if (!process.env.GEMINI_API_KEY) {
    const fallback = generateDeterministicPlanFallback(
      profile.city,
      band,
      profile.members,
    );
    setCached(cacheKey, fallback, 30 * 60 * 1000);
    return res.status(200).json(fallback);
  }

  // AI Prompting: Code owns all facts and numbers
  const systemPrompt = `You are "AirWise", a compassionate, rigorously scientific Urban Air Quality Assistant.
STRICT PRODUCT RULES:
1. All pollution numbers (AQI: ${aqi}, Band: ${band}, PM2.5: ${pm25} µg/m³) are calculated by code. You MUST NEVER invent or alter these numbers.
2. You do not provide medical advice. Provide general preventative exposure-reduction guidance only.
3. Be honest about physics: houseplants do NOT filter PM2.5 particulates. N95 respirators are necessary during Poor/Severe smog.
4. Output strict JSON matching the schema provided.`;

  const userPrompt = `Household Profile Data:
- City: ${profile.city}
- CPCB AQI: ${aqi} (${band} Band, PM2.5: ${pm25} µg/m³)
- Family Members: ${profile.members.join(", ")}
- Daily Commute: ${profile.commuteMode} (${profile.commuteDistanceKm} km one-way)
- Home Type: ${profile.homeType}
- Cooking Fuel: ${profile.cookingFuel}
- Indoor Risks: ${profile.indoorRisks.join(", ")}
- Has Air Purifier: ${profile.hasAirPurifier ? "Yes" : "No"}
- Monthly Budget: ₹${profile.monthlyBudgetInr}
- Preferred Language: ${profile.preferredLanguage}

Synthesize a deeply personalized winter smog defence plan:
1. headline: Engaging, empowering title.
2. todayRiskSummary: 2-3 sentences assessing today's specific risk for this exact household.
3. memberRisks: Array of risks and specific actionable steps for each member category in the profile.
4. lowEmissionRoutine: Morning, Commute, and Evening routines with actionable checkable steps that simultaneously cut local emissions and safeguard lungs.
5. indoorAirHacks: Practical, highly effective indoor air actions (ventilation timing based on smog inversions, DIY purifier hack, honest note on plants, cooking/cleaning).
6. sustainableCommuteSwap: A pragmatic lower-emission commute swap with estimated CO2 saved.
7. whyThisMatters: A succinct explanation of winter temperature inversions and community action.`;

  try {
    const { data } = await callGeminiJson<PersonalizedPlan>(
      systemPrompt,
      userPrompt,
      PersonalizedPlanSchema,
    );

    setCached(cacheKey, data, 30 * 60 * 1000);
    return res.status(200).json(data);
  } catch (error: unknown) {
    console.warn(
      "Gemini Plan generation failed; delivering deterministic fallback",
      error,
    );
    const fallback = generateDeterministicPlanFallback(
      profile.city,
      band,
      profile.members,
    );
    setCached(cacheKey, fallback, 30 * 60 * 1000);
    return res.status(200).json(fallback);
  }
}
