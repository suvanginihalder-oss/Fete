import { z } from "zod";

/**
 * Household member risk factors
 */
export const HouseholdMemberSchema = z.enum([
  "children",
  "elderly",
  "asthma_respiratory",
  "heart_condition",
  "pregnancy",
  "healthy_adult",
]);
export type HouseholdMember = z.infer<typeof HouseholdMemberSchema>;

export const CommuteModeSchema = z.enum([
  "metro_train",
  "bus",
  "car_petrol_diesel",
  "electric_vehicle",
  "motorcycle_scooter",
  "bicycle",
  "walk",
  "work_from_home",
]);
export type CommuteMode = z.infer<typeof CommuteModeSchema>;

export const HomeTypeSchema = z.enum([
  "high_rise_apartment",
  "low_rise_apartment",
  "independent_house",
  "slum_or_dense_cluster",
]);
export type HomeType = z.infer<typeof HomeTypeSchema>;

export const CookingFuelSchema = z.enum([
  "piped_gas_lpg",
  "induction_electric",
  "wood_biomass_coal",
]);
export type CookingFuel = z.infer<typeof CookingFuelSchema>;

export const IndoorRisksSchema = z.enum([
  "incense_dhoop",
  "mosquito_coils",
  "tobacco_smoke",
  "unvented_fireplace",
  "none",
]);
export type IndoorRisk = z.infer<typeof IndoorRisksSchema>;

/**
 * Strict Household Profile Schema for user input
 */
export const HouseholdProfileSchema = z.object({
  city: z.string().min(2, "City name must be at least 2 characters").max(60),
  members: z
    .array(HouseholdMemberSchema)
    .min(1, "Select at least one member category"),
  commuteMode: CommuteModeSchema,
  commuteDistanceKm: z.number().min(0, "Distance must be positive").max(200),
  homeType: HomeTypeSchema,
  cookingFuel: CookingFuelSchema,
  indoorRisks: z.array(IndoorRisksSchema).default(["none"]),
  hasAirPurifier: z.boolean().default(false),
  monthlyBudgetInr: z.number().min(0).max(100000).default(2000),
  preferredLanguage: z.enum(["English", "Hindi"]).default("English"),
});

export type HouseholdProfile = z.infer<typeof HouseholdProfileSchema>;

/**
 * Default sample profile for Delhi winter smog
 */
export const DEFAULT_DELHI_PROFILE: HouseholdProfile = {
  city: "Delhi",
  members: ["children", "elderly", "asthma_respiratory"],
  commuteMode: "car_petrol_diesel",
  commuteDistanceKm: 14,
  homeType: "high_rise_apartment",
  cookingFuel: "piped_gas_lpg",
  indoorRisks: ["incense_dhoop"],
  hasAirPurifier: false,
  monthlyBudgetInr: 3000,
  preferredLanguage: "English",
};

/**
 * CPCB Indian AQI Bands
 */
export type AQIBand =
  "Good" | "Satisfactory" | "Moderate" | "Poor" | "Very Poor" | "Severe";

export interface AQIResult {
  aqi: number;
  band: AQIBand;
  prominentPollutant: "PM2.5" | "PM10" | "NO2" | "SO2" | "O3" | "CO";
  subIndices: {
    pm25?: number;
    pm10?: number;
    no2?: number;
    so2?: number;
    o3?: number;
    co?: number;
  };
  whoComparisons: {
    pm25Ratio: number; // vs WHO 24h limit (15 ug/m3)
    pm10Ratio: number; // vs WHO 24h limit (45 ug/m3)
    pm25Exceeds: boolean;
    pm10Exceeds: boolean;
  };
}

export interface CurrentPollutants {
  pm2_5: number;
  pm10: number;
  nitrogen_dioxide: number;
  sulphur_dioxide: number;
  ozone: number;
  carbon_monoxide: number;
}

export interface HourlyForecastItem {
  time: string; // ISO 8601
  pm2_5: number;
  pm10: number;
  aqi: number;
  band: AQIBand;
}

export interface AirQualityData {
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  timestamp: string;
  current: CurrentPollutants;
  aqi: AQIResult;
  hourly: HourlyForecastItem[];
  sourceAttribution: string;
  isModelledEstimate: boolean;
  gridResolutionKm: number;
  openAQComparison?: {
    stationName: string;
    distanceKm: number;
    pm25?: number;
    pm10?: number;
    recordedAt: string;
  } | null;
}

/**
 * Time Window Analysis
 */
export interface TimeWindows {
  bestOutdoorWindow: {
    start: string;
    end: string;
    avgAqi: number;
    avgPm25: number;
    explanation: string;
  };
  bestVentilationWindow: {
    start: string;
    end: string;
    avgPm25: number;
    explanation: string;
  };
  worstWindow: {
    start: string;
    end: string;
    peakPm25: number;
    explanation: string;
  };
}

/**
 * Deterministic Baseline Advice
 */
export interface BaselineAdvice {
  band: AQIBand;
  summary: string;
  maskRecommendation: string;
  schoolOutdoorPolicy: string;
  exerciseGuidance: string;
  ventilationGuidance: string;
  purifierGuidance: string;
  highRiskPrecautions: string[];
  disclaimer: string;
}

/**
 * AI Personalized Plan Schema
 */
export const PersonalizedPlanSchema = z.object({
  headline: z.string().catch("Personalized Winter Smog Action Plan"),
  todayRiskSummary: z
    .string()
    .catch("Air quality requires proactive precautions for family health."),
  memberRisks: z
    .array(
      z.object({
        category: z.string(),
        riskLevel: z
          .enum(["Low", "Moderate", "High", "Critical"])
          .catch("High"),
        action: z.string(),
      }),
    )
    .catch([]),
  lowEmissionRoutine: z.object({
    morning: z.array(z.string()).catch([]),
    commute: z.array(z.string()).catch([]),
    evening: z.array(z.string()).catch([]),
  }),
  indoorAirHacks: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        category: z
          .enum(["Ventilation", "Purification", "Source Reduction", "Habits"])
          .catch("Habits"),
        costEstimate: z.string().catch("Low cost"),
      }),
    )
    .catch([]),
  sustainableCommuteSwap: z.object({
    currentMode: z.string().catch("Private vehicle"),
    suggestedMode: z.string().catch("Public transit or EV carpool"),
    monthlyCo2SavedKg: z.number().catch(0),
    explanation: z
      .string()
      .catch(
        "Reducing vehicle emissions directly cuts local particulate concentration.",
      ),
  }),
  whyThisMatters: z
    .string()
    .catch(
      "Winter temperature inversions trap smog near ground level; family routines and emission cuts safeguard vital lung capacity.",
    ),
  isAiGenerated: z.boolean().default(true),
  fallbackUsed: z.boolean().default(false),
  generationNotice: z
    .string()
    .catch(
      "Ground advice synthesized by AI from official CPCB/Open-Meteo readings.",
    ),
});

export type PersonalizedPlan = z.infer<typeof PersonalizedPlanSchema>;

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  timestamp: string;
  isFallback?: boolean;
}
