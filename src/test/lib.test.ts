import { describe, it, expect } from "vitest";
import { analyzeTimeWindows } from "../lib/timeWindow.js";
import { generateBaselineAdvice } from "../lib/baselineAdvice.js";
import {
  calculateCommuteSwap,
  EMISSION_FACTORS_KG_CO2_PER_KM,
} from "../lib/emissions.js";
import {
  encodeProfileShareUrl,
  decodeProfileShareUrl,
} from "../lib/storage.js";
import { DEFAULT_DELHI_PROFILE } from "../types/index.js";

describe("timeWindow analysis (src/lib/timeWindow.ts)", () => {
  it("identifies best outdoor and worst smog windows from 48h forecast", () => {
    const hourly = [
      {
        time: "2026-11-21T06:00:00Z",
        pm2_5: 350,
        pm10: 450,
        aqi: 420,
        band: "Severe" as const,
      },
      {
        time: "2026-11-21T07:00:00Z",
        pm2_5: 380,
        pm10: 480,
        aqi: 440,
        band: "Severe" as const,
      },
      {
        time: "2026-11-21T08:00:00Z",
        pm2_5: 320,
        pm10: 410,
        aqi: 405,
        band: "Severe" as const,
      },
      {
        time: "2026-11-21T13:00:00Z",
        pm2_5: 65,
        pm10: 110,
        aqi: 152,
        band: "Moderate" as const,
      },
      {
        time: "2026-11-21T14:00:00Z",
        pm2_5: 60,
        pm10: 105,
        aqi: 150,
        band: "Moderate" as const,
      },
      {
        time: "2026-11-21T15:00:00Z",
        pm2_5: 70,
        pm10: 115,
        aqi: 155,
        band: "Moderate" as const,
      },
    ];

    const result = analyzeTimeWindows(hourly);
    expect(result.bestOutdoorWindow).toBeDefined();
    expect(result.bestVentilationWindow).toBeDefined();
    expect(result.worstWindow).toBeDefined();
    expect(result.worstWindow.peakPm25).toBeGreaterThan(300);
  });

  it("gracefully handles empty hourly arrays with fallback windows", () => {
    const result = analyzeTimeWindows([]);
    expect(result.bestOutdoorWindow.start).toBe("13:00");
    expect(result.worstWindow.start).toBe("06:00");
  });
});

describe("baselineAdvice generator (src/lib/baselineAdvice.ts)", () => {
  it("generates strict N95 recommendations for Poor or worse air", () => {
    const advice = generateBaselineAdvice("Severe", DEFAULT_DELHI_PROFILE);
    expect(advice.maskRecommendation).toContain("N95");
    expect(advice.disclaimer).toContain("General guidance, not medical advice");
    expect(advice.highRiskPrecautions.length).toBeGreaterThan(0);
  });

  it("adjusts advice when household has asthma or children", () => {
    const modAdvice = generateBaselineAdvice("Moderate", DEFAULT_DELHI_PROFILE);
    expect(modAdvice.summary).toContain("sensitive");
  });
});

describe("emissions calculation (src/lib/emissions.ts)", () => {
  it("calculates CO2 savings when switching from car to metro", () => {
    const impact = calculateCommuteSwap("car_petrol_diesel", 15, 22);
    expect(impact.currentDailyCo2Kg).toBeGreaterThan(0);
    expect(impact.monthlyCo2SavingsKg).toBeGreaterThan(0);
    expect(impact.label).toContain("estimate");
  });

  it("has valid constants for all commute modes", () => {
    expect(EMISSION_FACTORS_KG_CO2_PER_KM.bicycle).toBe(0);
    expect(EMISSION_FACTORS_KG_CO2_PER_KM.car_petrol_diesel).toBe(0.17);
  });
});

describe("storage and URL sharing (src/lib/storage.ts)", () => {
  it("compresses and decompresses household profile seamlessly", () => {
    const shareUrl = encodeProfileShareUrl(DEFAULT_DELHI_PROFILE);
    const param = shareUrl.split("?share=")[1];
    const restored = decodeProfileShareUrl(param);
    expect(restored).not.toBeNull();
    expect(restored?.city).toBe(DEFAULT_DELHI_PROFILE.city);
    expect(restored?.commuteMode).toBe(DEFAULT_DELHI_PROFILE.commuteMode);
  });
});
