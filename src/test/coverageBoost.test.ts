import { describe, it, expect, beforeEach } from "vitest";
import {
  loadHouseholdProfile,
  saveHouseholdProfile,
  getSavedCities,
  addSavedCity,
  loadCheckedTasks,
  saveCheckedTasks,
} from "../lib/storage.js";
import { generateBaselineAdvice } from "../lib/baselineAdvice.js";
import { calculateCommuteSwap } from "../lib/emissions.js";
import { callGeminiJson } from "../lib/ai/geminiAdapter.js";
import { z } from "zod";
import { DEFAULT_DELHI_PROFILE } from "../types/index.js";

describe("Comprehensive Coverage for storage.ts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads and saves profile via localStorage", () => {
    expect(loadHouseholdProfile()).toEqual(DEFAULT_DELHI_PROFILE);
    const custom = { ...DEFAULT_DELHI_PROFILE, city: "Bengaluru" };
    expect(saveHouseholdProfile(custom)).toBe(true);
    expect(loadHouseholdProfile().city).toBe("Bengaluru");
  });

  it("manages saved cities list correctly", () => {
    expect(getSavedCities().length).toBeGreaterThan(0);
    addSavedCity("Pune");
    expect(getSavedCities()).toContain("Pune");
  });

  it("manages checked task persistence", () => {
    const today = "2026-11-21";
    expect(loadCheckedTasks(today)).toEqual({});
    saveCheckedTasks(today, { task1: true });
    expect(loadCheckedTasks(today)).toEqual({ task1: true });
  });
});

describe("Comprehensive Coverage for baselineAdvice.ts (all bands)", () => {
  const bands = [
    "Good",
    "Satisfactory",
    "Moderate",
    "Poor",
    "Very Poor",
    "Severe",
  ] as const;
  for (const b of bands) {
    it(`generates complete baseline advice for band ${b}`, () => {
      const adv = generateBaselineAdvice(b, DEFAULT_DELHI_PROFILE);
      expect(adv.band).toBe(b);
      expect(adv.maskRecommendation).toBeTruthy();
      expect(adv.purifierGuidance).toBeTruthy();
      expect(adv.ventilationGuidance).toBeTruthy();
      expect(adv.disclaimer).toBeTruthy();
    });
  }
});

describe("Comprehensive Coverage for emissions.ts swaps", () => {
  it("covers bus and transit swaps", () => {
    const busSwap = calculateCommuteSwap("bus", 10, 20);
    expect(busSwap.suggestedAlternative).toBe("work_from_home");
    const bikeSwap = calculateCommuteSwap("bicycle", 5, 20);
    expect(bikeSwap.suggestedAlternative).toBe("walk");
  });
});

describe("callGeminiJson fallback & error handling", () => {
  it("throws error when GEMINI_API_KEY is missing", async () => {
    const oldKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    await expect(
      callGeminiJson("sys", "user", z.object({ ok: z.boolean() })),
    ).rejects.toThrow("GEMINI_API_KEY");
    process.env.GEMINI_API_KEY = oldKey;
  });
});
