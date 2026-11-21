import { describe, it, expect } from "vitest";
import { calculateSubIndex, computeAQI, getBandDetails } from "../lib/aqi.js";

describe("CPCB AQI calculations (src/lib/aqi.ts)", () => {
  it("correctly calculates PM2.5 sub-indices based on CPCB breakpoints", () => {
    // 0-30 => 0-50
    expect(computeAQI({ pm2_5: 15, pm10: 20 }).aqi).toBe(25);
    // 31-60 => 51-100 (e.g. 60 => 100)
    expect(computeAQI({ pm2_5: 60, pm10: 50 }).aqi).toBe(100);
    // 61-90 => 101-200 (e.g. 75 => 152)
    const midMod = computeAQI({ pm2_5: 75, pm10: 50 });
    expect(midMod.aqi).toBeGreaterThanOrEqual(140);
    expect(midMod.aqi).toBeLessThanOrEqual(160);
    expect(midMod.band).toBe("Moderate");
    // 91-120 => 201-300
    expect(computeAQI({ pm2_5: 120, pm10: 100 }).band).toBe("Poor");
    // 121-250 => 301-400
    expect(computeAQI({ pm2_5: 200, pm10: 100 }).band).toBe("Very Poor");
    // 251+ => 401-500
    expect(computeAQI({ pm2_5: 350, pm10: 450 }).band).toBe("Severe");
  });

  it("correctly calculates PM10 sub-indices and picks the prominent pollutant", () => {
    // PM10 is 400 (Very Poor) while PM2.5 is 20 (Good)
    const res = computeAQI({ pm2_5: 20, pm10: 400 });
    expect(res.prominentPollutant).toBe("PM10");
    expect(res.band).toBe("Very Poor");
  });

  it("computes accurate ratios against WHO 2021 air quality guidelines", () => {
    // WHO 24h limit: PM2.5 = 15, PM10 = 45
    const res = computeAQI({ pm2_5: 150, pm10: 90 });
    expect(res.whoComparisons.pm25Ratio).toBe(10.0);
    expect(res.whoComparisons.pm10Ratio).toBe(2.0);
    expect(res.whoComparisons.pm25Exceeds).toBe(true);
    expect(res.whoComparisons.pm10Exceeds).toBe(true);
  });

  it("handles zero or negative readings safely", () => {
    expect(calculateSubIndex(0, [])).toBe(0);
    expect(calculateSubIndex(-10, [])).toBe(0);
    const res = computeAQI({ pm2_5: 0, pm10: 0 });
    expect(res.aqi).toBe(0);
    expect(res.band).toBe("Good");
  });

  it("returns valid band tokens and styles for all 6 CPCB bands", () => {
    const bands = [
      "Good",
      "Satisfactory",
      "Moderate",
      "Poor",
      "Very Poor",
      "Severe",
    ] as const;
    for (const b of bands) {
      const details = getBandDetails(b);
      expect(details.color).toBeTruthy();
      expect(details.textColor).toBeTruthy();
      expect(details.label).toContain(b);
    }
  });
});
