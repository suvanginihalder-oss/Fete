import type {
  AQIBand,
  BaselineAdvice,
  HouseholdProfile,
} from "../types/index.js";

/**
 * Deterministic baseline advice generated strictly from code based on official CPCB bands
 * and household vulnerability profile.
 *
 * Ensures the app remains 100% useful without AI and guarantees that no medical advice
 * or hallucinated health facts can occur.
 */
export function generateBaselineAdvice(
  band: AQIBand,
  profile: HouseholdProfile,
): BaselineAdvice {
  const isVulnerable = profile.members.some((m) =>
    [
      "children",
      "elderly",
      "asthma_respiratory",
      "heart_condition",
      "pregnancy",
    ].includes(m),
  );

  let maskRecommendation = "No mask necessary for healthy individuals.";
  let schoolOutdoorPolicy = "Normal outdoor activities permitted.";
  let exerciseGuidance = "Outdoor running and sports are fine.";
  let ventilationGuidance = "Normal natural ventilation permitted.";
  let purifierGuidance =
    "Air purifier not urgently needed; natural air exchange is safe.";
  const highRiskPrecautions: string[] = [];

  switch (band) {
    case "Good":
      maskRecommendation = "Clean air. No masks required.";
      schoolOutdoorPolicy = "Full outdoor sports and activities encouraged.";
      exerciseGuidance =
        "Ideal conditions for outdoor training and aerobic exercise.";
      ventilationGuidance = "Open windows freely for cross-ventilation.";
      purifierGuidance = "Keep purifier off to conserve electricity.";
      break;

    case "Satisfactory":
      maskRecommendation =
        "Masks generally not required except for unusually sensitive individuals.";
      schoolOutdoorPolicy = "Outdoor play and sports permitted.";
      exerciseGuidance =
        "Outdoor workouts are fine; sensitive individuals should monitor comfort.";
      ventilationGuidance =
        "Open windows for cross-ventilation during daytime.";
      purifierGuidance =
        "Optional: run purifier on low/eco mode in bedrooms overnight.";
      if (profile.members.includes("asthma_respiratory")) {
        highRiskPrecautions.push(
          "Keep quick-relief bronchodilator inhalers accessible.",
        );
      }
      break;

    case "Moderate":
      maskRecommendation = isVulnerable
        ? "Vulnerable groups (children, elderly, respiratory patients) should wear a well-fitted N95 mask outdoors."
        : "Healthy individuals can manage without masks, but sensitive individuals should carry N95.";
      schoolOutdoorPolicy =
        "Permitted, but reduce prolonged strenuous drills for children with asthma.";
      exerciseGuidance =
        "Shift heavy aerobic workouts to afternoons or indoors; avoid early morning runs.";
      ventilationGuidance =
        "Limit window opening to 15-minute bursts during early afternoon solar peak.";
      purifierGuidance =
        "Run purifier in occupied rooms, especially living and sleeping spaces.";
      if (profile.members.includes("children")) {
        highRiskPrecautions.push(
          "Advise schools to limit high-intensity sprint training.",
        );
      }
      if (
        profile.members.includes("asthma_respiratory") ||
        profile.members.includes("heart_condition")
      ) {
        highRiskPrecautions.push(
          "Monitor for coughing, wheezing or chest tightness; stay indoors if symptomatic.",
        );
      }
      break;

    case "Poor":
      maskRecommendation =
        "N95 / FFP2 respirators strongly recommended outdoors for all family members.";
      schoolOutdoorPolicy =
        "Schools should cancel strenuous outdoor sports and keep recess indoors or short.";
      exerciseGuidance =
        "Avoid outdoor jogging and cycling. Exercise indoors away from open windows.";
      ventilationGuidance =
        "Keep external windows and doors closed. Ventilate only during lowest PM2.5 afternoon window.";
      purifierGuidance =
        "Run air purifiers continuously on auto/medium mode in occupied rooms.";
      highRiskPrecautions.push(
        "High-risk members must minimize outdoor exposure entirely.",
      );
      highRiskPrecautions.push(
        "Seal drafty doors and window frames with damp towels or foam weather strips.",
      );
      if (profile.members.includes("asthma_respiratory")) {
        highRiskPrecautions.push(
          "Ensure emergency inhaler and peak flow meter are on hand.",
        );
      }
      break;

    case "Very Poor":
      maskRecommendation =
        "N95 / FFP2 respirators mandatory outdoors. Cloth and surgical masks are ineffective against PM2.5.";
      schoolOutdoorPolicy =
        "Suspend all outdoor school assemblies, sports, and physical training.";
      exerciseGuidance =
        "Strictly zero outdoor workouts. Heavy breathing draws ultrafine particles deep into alveoli.";
      ventilationGuidance =
        "Keep all windows sealed. Do not ventilate unless indoor CO2 exceeds comfortable levels.";
      purifierGuidance =
        'Run purifiers on high mode. Create a designated "clean air room" where the family gathers.';
      highRiskPrecautions.push(
        "Elderly and children must remain indoors in filtered air.",
      );
      highRiskPrecautions.push(
        "Cease all indoor combustion: no incense sticks (agarbatti), mosquito coils, or smoking.",
      );
      highRiskPrecautions.push(
        "Use kitchen chimney/exhaust during cooking to prevent trapping indoor VOCs.",
      );
      break;

    case "Severe":
    default:
      maskRecommendation =
        "STRICT: Stay indoors. If stepping outside is unavoidable, wear a tightly sealed N95/N99 respirator.";
      schoolOutdoorPolicy =
        "Schools should transition to online classes or keep children strictly inside air-filtered classrooms.";
      exerciseGuidance =
        "Zero outdoor exertion. Gentle indoor stretching only with air filtration active.";
      ventilationGuidance =
        "DO NOT open windows. Keep homes completely sealed against ambient smog infiltration.";
      purifierGuidance =
        "Run purifiers on maximum turbo mode 24/7. In rooms without purifiers, use wet mop cleaning (never dry sweeping).";
      highRiskPrecautions.push(
        "EMERGENCY LEVEL: Medical vulnerability is elevated for all household members.",
      );
      highRiskPrecautions.push(
        "Pregnant women, infants, and heart/lung patients should not leave the clean room.",
      );
      highRiskPrecautions.push(
        "Have primary physician numbers ready if sudden breathlessness or chest pain occurs.",
      );
      highRiskPrecautions.push(
        "If no purifier is available, construct an emergency DIY Box Fan + HEPA filter hack.",
      );
      break;
  }

  return {
    band,
    summary: `Air quality is in the ${band} band. ${isVulnerable ? "Your household includes sensitive groups requiring heightened vigilance." : "Follow preventative protocols to protect long-term lung health."}`,
    maskRecommendation,
    schoolOutdoorPolicy,
    exerciseGuidance,
    ventilationGuidance,
    purifierGuidance,
    highRiskPrecautions,
    disclaimer:
      "General guidance, not medical advice. Consult a licensed medical practitioner for clinical symptoms.",
  };
}
