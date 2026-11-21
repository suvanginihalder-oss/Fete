import React from "react";
import { AlertTriangle, ShieldCheck, Info, X } from "lucide-react";
import type { AQIBand } from "../types/index.js";

interface AlertBannerProps {
  band: AQIBand;
  aqi: number;
  city: string;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  band,
  aqi,
  city,
}) => {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed) return null;

  const isHighRisk =
    band === "Poor" || band === "Very Poor" || band === "Severe";

  if (!isHighRisk) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-sm text-emerald-800 flex items-center justify-between"
      >
        <div className="flex items-center gap-2 max-w-5xl mx-auto w-full">
          <ShieldCheck
            className="w-5 h-5 text-emerald-600 flex-shrink-0"
            aria-hidden="true"
          />
          <span>
            <strong>
              Air Quality in {city} is {band} (AQI {aqi}).
            </strong>{" "}
            Outdoor activities are safe. Natural ventilation encouraged.
          </span>
        </div>
      </div>
    );
  }

  const actions = {
    Poor: [
      "Wear an N95 respirator during outdoor transit.",
      "Close windows; ventilate only during midday trough.",
      "Shift strenuous cardio workouts indoors.",
    ],
    "Very Poor": [
      "Mandatory N95 masks for all outdoor exposure.",
      "Run indoor air purifiers on high/auto mode continuously.",
      "Zero burning of incense (agarbatti) or mosquito coils indoors.",
    ],
    Severe: [
      "STRICT: Seal all doors and windows with damp towels or weather strips.",
      "High-risk family members (children, elderly, asthma) must stay in a filtered clean room.",
      "Cancel outdoor sports and non-essential travel.",
    ],
  }[band] || [
    "Wear an N95 respirator.",
    "Keep windows tightly sealed.",
    "Run air filtration indoors.",
  ];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-rose-600 text-white px-4 py-3 shadow-md border-b border-rose-700"
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="w-6 h-6 text-amber-300 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <div className="flex items-center gap-2 font-bold text-base">
              <span>
                SMOG ADVISORY: {band.toUpperCase()} AIR QUALITY IN{" "}
                {city.toUpperCase()}
              </span>
              <span className="bg-rose-800 text-rose-100 text-xs px-2 py-0.5 rounded-full font-mono">
                AQI {aqi}
              </span>
            </div>
            <div className="text-xs text-rose-100 mt-1 flex flex-wrap gap-x-4 gap-y-1">
              {actions.map((act, idx) => (
                <span key={idx} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300"></span>
                  {act}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end md:self-center">
          <span className="text-[11px] text-rose-200 hidden lg:inline flex items-center gap-1">
            <Info className="w-3.5 h-3.5" aria-hidden="true" /> General
            guidance, not medical advice
          </span>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded hover:bg-rose-700 text-rose-200 hover:text-white transition-colors focus:ring-2 focus:ring-white focus:outline-none"
            aria-label="Dismiss smog advisory banner"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
};
