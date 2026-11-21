import type { CommuteMode } from "../types/index.js";

/**
 * Emission factors for daily commute modes (kg CO2e per passenger-km)
 * Sources & References:
 * - Central Pollution Control Board (CPCB) India / ARAI Emission Factors
 * - UK DEFRA / Our World in Data Passenger Transport Carbon Intensities
 *
 * Clearly labeled as estimates for user transparency.
 */
export const EMISSION_FACTORS_KG_CO2_PER_KM: Record<CommuteMode, number> = {
  // Petrol/diesel average passenger car: ~0.170 kg CO2e/km (assuming single or low occupancy)
  car_petrol_diesel: 0.17,
  // Two-wheeler (petrol motorcycle/scooter): ~0.045 kg CO2e/km
  motorcycle_scooter: 0.045,
  // Electric Vehicle (grid-powered): ~0.050 kg CO2e/km
  electric_vehicle: 0.05,
  // Municipal bus transit (average occupancy): ~0.030 kg CO2e/passenger-km
  bus: 0.03,
  // Metro rail / Suburban train: ~0.015 kg CO2e/passenger-km
  metro_train: 0.015,
  // Active zero-emission transit
  bicycle: 0.0,
  walk: 0.0,
  work_from_home: 0.0,
};

export interface CommuteImpactEstimate {
  currentMode: CommuteMode;
  currentDailyCo2Kg: number;
  currentMonthlyCo2Kg: number;
  suggestedAlternative: CommuteMode;
  alternativeMonthlyCo2Kg: number;
  monthlyCo2SavingsKg: number;
  treesEquivalentAnnual: number;
  label: string;
}

/**
 * Computes estimated carbon reduction and commute swap benefits
 * Working days per month: 22 days, round trip = distance * 2
 */
export function calculateCommuteSwap(
  mode: CommuteMode,
  oneWayDistanceKm: number,
  workingDaysPerMonth: number = 22,
): CommuteImpactEstimate {
  const roundTripKm = Math.max(0, oneWayDistanceKm * 2);
  const factor = EMISSION_FACTORS_KG_CO2_PER_KM[mode] ?? 0.17;
  const currentDaily = roundTripKm * factor;
  const currentMonthly = currentDaily * workingDaysPerMonth;

  // Select clean swap recommendation
  let alternative: CommuteMode = "metro_train";
  if (mode === "car_petrol_diesel" || mode === "motorcycle_scooter") {
    alternative = roundTripKm > 10 ? "metro_train" : "bus";
  } else if (mode === "bus" || mode === "metro_train") {
    alternative = "work_from_home";
  } else {
    alternative = "walk";
  }

  const altFactor = EMISSION_FACTORS_KG_CO2_PER_KM[alternative];
  const altMonthly = roundTripKm * altFactor * workingDaysPerMonth;
  const savings = Math.max(0, currentMonthly - altMonthly);

  // 1 urban tree absorbs approx 21.7 kg CO2 per year
  const trees = Number(((savings * 12) / 21.7).toFixed(1));

  return {
    currentMode: mode,
    currentDailyCo2Kg: Number(currentDaily.toFixed(2)),
    currentMonthlyCo2Kg: Number(currentMonthly.toFixed(1)),
    suggestedAlternative: alternative,
    alternativeMonthlyCo2Kg: Number(altMonthly.toFixed(1)),
    monthlyCo2SavingsKg: Number(savings.toFixed(1)),
    treesEquivalentAnnual: trees,
    label: "Modelled emission estimate (kg CO2e)",
  };
}
