import type { AQIBand, AQIResult } from "../types/index.js";

/**
 * CPCB (Central Pollution Control Board, Ministry of Environment, Forest & Climate Change, India)
 * Official National Air Quality Index (NAQI) Breakpoints:
 * Reference: CPCB NAQI Technical Report (2014) / CPCB Breakpoint Criteria
 *
 * PM2.5 (24-hr average in µg/m³):
 *   Good:         0 - 30      (AQI: 0 - 50)
 *   Satisfactory: 31 - 60     (AQI: 51 - 100)
 *   Moderate:     61 - 90     (AQI: 101 - 200)
 *   Poor:         91 - 120    (AQI: 201 - 300)
 *   Very Poor:    121 - 250   (AQI: 301 - 400)
 *   Severe:       250+        (AQI: 401 - 500)
 *
 * PM10 (24-hr average in µg/m³):
 *   Good:         0 - 50      (AQI: 0 - 50)
 *   Satisfactory: 51 - 100    (AQI: 51 - 100)
 *   Moderate:     101 - 250   (AQI: 101 - 200)
 *   Poor:         251 - 350   (AQI: 201 - 300)
 *   Very Poor:    351 - 430   (AQI: 301 - 400)
 *   Severe:       430+        (AQI: 401 - 500)
 *
 * WHO 2021 Global Air Quality Guidelines:
 *   PM2.5 24-hr mean limit: 15 µg/m³
 *   PM10 24-hr mean limit:  45 µg/m³
 */

export const WHO_GUIDELINES = {
  PM25_24H_LIMIT: 15,
  PM10_24H_LIMIT: 45,
} as const;

interface Breakpoint {
  bLo: number;
  bHi: number;
  iLo: number;
  iHi: number;
}

const PM25_BREAKPOINTS: Breakpoint[] = [
  { bLo: 0, bHi: 30, iLo: 0, iHi: 50 },
  { bLo: 31, bHi: 60, iLo: 51, iHi: 100 },
  { bLo: 61, bHi: 90, iLo: 101, iHi: 200 },
  { bLo: 91, bHi: 120, iLo: 201, iHi: 300 },
  { bLo: 121, bHi: 250, iLo: 301, iHi: 400 },
  { bLo: 251, bHi: 500, iLo: 401, iHi: 500 },
];

const PM10_BREAKPOINTS: Breakpoint[] = [
  { bLo: 0, bHi: 50, iLo: 0, iHi: 50 },
  { bLo: 51, bHi: 100, iLo: 51, iHi: 100 },
  { bLo: 101, bHi: 250, iLo: 101, iHi: 200 },
  { bLo: 251, bHi: 350, iLo: 201, iHi: 300 },
  { bLo: 351, bHi: 430, iLo: 301, iHi: 400 },
  { bLo: 431, bHi: 600, iLo: 401, iHi: 500 },
];

/**
 * Linear interpolation to calculate sub-index Ip for a given concentration Cp
 * Ip = [ (IHi - ILo) / (BHi - BLo) ] * (Cp - BLo) + ILo
 */
export function calculateSubIndex(
  concentration: number,
  breakpoints: Breakpoint[],
): number {
  if (concentration <= 0) return 0;

  for (const bp of breakpoints) {
    if (concentration <= bp.bHi) {
      const sub =
        ((bp.iHi - bp.iLo) / (bp.bHi - bp.bLo)) * (concentration - bp.bLo) +
        bp.iLo;
      return Math.round(Math.min(500, Math.max(0, sub)));
    }
  }

  // Above the highest breakpoint: scale beyond 500 or cap at 500 (standard CPCB scales up to 500)
  return 500;
}

/**
 * Determine the CPCB AQI Band from overall AQI value
 */
export function getAQIBand(aqi: number): AQIBand {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Satisfactory";
  if (aqi <= 200) return "Moderate";
  if (aqi <= 300) return "Poor";
  if (aqi <= 400) return "Very Poor";
  return "Severe";
}

/**
 * Returns color tokens and badges for each band
 */
export function getBandDetails(band: AQIBand): {
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  label: string;
  description: string;
} {
  switch (band) {
    case "Good":
      return {
        color: "#16a34a",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-300",
        textColor: "text-emerald-800",
        label: "Good (0–50)",
        description: "Minimal impact. Enjoy normal outdoor activities.",
      };
    case "Satisfactory":
      return {
        color: "#65a30d",
        bgColor: "bg-lime-50",
        borderColor: "border-lime-300",
        textColor: "text-lime-800",
        label: "Satisfactory (51–100)",
        description: "Minor breathing discomfort to sensitive people.",
      };
    case "Moderate":
      return {
        color: "#ca8a04",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-300",
        textColor: "text-yellow-800",
        label: "Moderate (101–200)",
        description:
          "Breathing discomfort to people with lung, heart disease, children and older adults.",
      };
    case "Poor":
      return {
        color: "#ea580c",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-300",
        textColor: "text-orange-800",
        label: "Poor (201–300)",
        description:
          "Breathing discomfort to most people on prolonged exposure.",
      };
    case "Very Poor":
      return {
        color: "#dc2626",
        bgColor: "bg-red-50",
        borderColor: "border-red-300",
        textColor: "text-red-800",
        label: "Very Poor (301–400)",
        description:
          "Respiratory illness on prolonged exposure. Pronounced effect on lung and heart disease patients.",
      };
    case "Severe":
    default:
      return {
        color: "#7f1d1d",
        bgColor: "bg-rose-100",
        borderColor: "border-rose-400",
        textColor: "text-rose-950",
        label: "Severe (401–500)",
        description:
          "Affects healthy people and seriously impacts those with existing diseases.",
      };
  }
}

/**
 * Computes official CPCB AQI from pollutant values
 * Requires at least 3 parameters including PM2.5 or PM10 (CPCB rule: minimum 3 pollutants with 1 particulate).
 * We calculate sub-indices for PM2.5 and PM10, pick the maximum as overall AQI.
 */
export function computeAQI(params: {
  pm2_5: number;
  pm10: number;
  nitrogen_dioxide?: number;
  sulphur_dioxide?: number;
  ozone?: number;
  carbon_monoxide?: number;
}): AQIResult {
  const pm25Sub = calculateSubIndex(params.pm2_5, PM25_BREAKPOINTS);
  const pm10Sub = calculateSubIndex(params.pm10, PM10_BREAKPOINTS);

  let overallAqi = Math.max(pm25Sub, pm10Sub);
  const prominent: "PM2.5" | "PM10" = pm25Sub >= pm10Sub ? "PM2.5" : "PM10";

  // Minimum clamp at 1 if non-zero
  if (overallAqi === 0 && (params.pm2_5 > 0 || params.pm10 > 0)) {
    overallAqi = 1;
  }

  const band = getAQIBand(overallAqi);

  const pm25Ratio = Number(
    (params.pm2_5 / WHO_GUIDELINES.PM25_24H_LIMIT).toFixed(1),
  );
  const pm10Ratio = Number(
    (params.pm10 / WHO_GUIDELINES.PM10_24H_LIMIT).toFixed(1),
  );

  return {
    aqi: overallAqi,
    band,
    prominentPollutant: prominent,
    subIndices: {
      pm25: pm25Sub,
      pm10: pm10Sub,
    },
    whoComparisons: {
      pm25Ratio,
      pm10Ratio,
      pm25Exceeds: params.pm2_5 > WHO_GUIDELINES.PM25_24H_LIMIT,
      pm10Exceeds: params.pm10 > WHO_GUIDELINES.PM10_24H_LIMIT,
    },
  };
}
