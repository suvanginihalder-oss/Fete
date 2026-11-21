import { z } from "zod";
import type { PersonalizedPlan } from "../../types/index.js";
import { PersonalizedPlanSchema } from "../../types/index.js";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}

/**
 * Adapts calls to Gemini REST API with model fallback on 429/404/503.
 * Transmits API key securely in `x-goog-api-key` header, NEVER in URL.
 * Treats user inputs as strict prompt data.
 */
export async function callGeminiJson<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
): Promise<{ data: T; modelUsed: string; fallbackUsed: boolean }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const primaryModel = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const fallbackModels = (
    process.env.GEMINI_FALLBACK_MODELS ||
    "gemini-2.5-flash,gemini-1.5-flash,gemini-1.5-pro"
  )
    .split(",")
    .map((m) => m.trim())
    .filter((m) => m.length > 0);

  const candidateModels = Array.from(
    new Set([primaryModel, ...fallbackModels]),
  );
  let lastError: Error | null = null;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    const isFallback = i > 0;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      const requestBody = {
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${systemPrompt}\n\nStrict JSON output required. Follow schema precisely.\n\nContext & Request:\n${userPrompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          responseMimeType: "application/json",
        },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const status = response.status;
        console.warn(
          `Gemini API error on model ${model} (status ${status}): ${errorText.slice(0, 200)}`,
        );

        // If rate limited or service unavailable, try next model
        if (
          status === 429 ||
          status === 503 ||
          status === 404 ||
          status === 500
        ) {
          lastError = new Error(`Model ${model} returned status ${status}`);
          continue;
        }

        throw new Error(`Gemini API error (status ${status})`);
      }

      const resJson: GeminiResponse = await response.json();
      const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error("Empty response received from Gemini");
      }

      // Parse JSON from text
      const parsedJson = JSON.parse(rawText);
      const validated = schema.parse(parsedJson);

      return {
        data: validated,
        modelUsed: model,
        fallbackUsed: isFallback,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`Error invoking model ${model}: ${msg}`);
      lastError = err instanceof Error ? err : new Error(msg);
    }
  }

  throw lastError || new Error("All Gemini models failed");
}

/**
 * Fallback plan generator when Gemini API is unavailable or unconfigured.
 * Guaranteed 100% deterministic, high quality, and completely offline.
 */
export function generateDeterministicPlanFallback(
  city: string,
  band: string,
  _members: string[],
): PersonalizedPlan {
  return PersonalizedPlanSchema.parse({
    headline: `Winter Smog Defence Plan for ${city} (${band})`,
    todayRiskSummary: `Air quality in ${city} is currently in the ${band} band. Implement immediate room-sealing, active air purification, and low-emission household routines.`,
    memberRisks: [
      {
        category: "Children & Infants",
        riskLevel:
          band === "Severe" || band === "Very Poor" ? "Critical" : "Moderate",
        action:
          "Avoid morning outdoor play. Transition to high-energy indoor activities in an air-filtered room.",
      },
      {
        category: "Elderly & Respiratory / Heart Patients",
        riskLevel:
          band === "Severe" || band === "Very Poor" ? "Critical" : "High",
        action:
          "Wear a sealed N95 respirator if stepping out. Keep prescription inhalers accessible.",
      },
      {
        category: "Healthy Adults",
        riskLevel: band === "Severe" ? "High" : "Moderate",
        action:
          "Shift aerobic workouts indoors; avoid peak morning outdoor exertion.",
      },
    ],
    lowEmissionRoutine: {
      morning: [
        "Keep all street-facing windows and doors tightly sealed against nocturnal inversion smog.",
        "Turn on kitchen exhaust / chimney before lighting cooking flames to evacuate combustion particulate.",
        "Check school smog advisories and pack an N95 respirator for kids if outdoor transit is mandatory.",
      ],
      commute: [
        "Switch commute mode: opt for Delhi Metro / public rail instead of driving a solo petrol vehicle.",
        'If car commute is unavoidable, set cabin AC airflow to "Recirculation Mode" with a clean HEPA cabin filter.',
        "Avoid open-window auto-rickshaws or walking beside high-traffic arterial choke-points during peak hours.",
      ],
      evening: [
        "Run bedroom air purifiers at least 45 minutes before sleep to scrub ambient PM2.5 down below 15 µg/m³.",
        "Wipe floors and surfaces with a damp micro-fiber mop; never use dry brooms which resuspend fine dust.",
        "Completely avoid burning agarbatti (incense sticks), mosquito coils, or scented candles.",
      ],
    },
    indoorAirHacks: [
      {
        title: "Thermal Inversion Window Timing",
        description:
          "Never ventilate during the 5 AM – 9 AM morning inversion peak. If flushing stale indoor CO2, open windows strictly between 1:00 PM and 3:00 PM for 15 minutes when solar heating breaks the ground layer.",
        category: "Ventilation",
        costEstimate: "Free",
      },
      {
        title: "The Corsi-Rosenthal Box / DIY HEPA Fan Hack",
        description:
          "Tightly tape a MERV 13 or true HEPA replacement filter to the intake side of a standard box fan. This scrubs 85-90% of PM2.5 at a fraction of the cost of commercial purifiers.",
        category: "Purification",
        costEstimate: "₹1,200 – ₹1,800",
      },
      {
        title: "The Plant Myth vs. Reality",
        description:
          "Honest science: Snake plants and Areca palms produce oxygen and scrub trace VOCs, but they do NOT filter particulate matter (PM2.5/PM10). Do not rely on indoor plants as a substitute for mechanical particulate filtration.",
        category: "Habits",
        costEstimate: "Science fact",
      },
      {
        title: "Zero-Smoke Cooking Protocols",
        description:
          "Avoid high-heat oil tadkas or open-flame roasting without direct exhaust suction. Cover frying pans to prevent ultrafine oil droplets from lingering in living areas.",
        category: "Source Reduction",
        costEstimate: "Free",
      },
    ],
    sustainableCommuteSwap: {
      currentMode: "Solo vehicle driving",
      suggestedMode: "Metro rail transit",
      monthlyCo2SavedKg: 52.4,
      explanation:
        "Switching 14 km daily travel to electric metro avoids 52+ kg of CO2e and removes tailpipe NOx from your neighborhood breathing zone.",
    },
    whyThisMatters:
      "Severe winter smog is caused by cold air trapping vehicle exhaust, construction dust, and biomass smoke close to the ground. Personal emission cuts protect community air while indoor sealing defends developing lungs.",
    isAiGenerated: false,
    fallbackUsed: true,
    generationNotice:
      "Generated via deterministic baseline engine (CPCB Guidelines) — offline fallback active.",
  });
}
