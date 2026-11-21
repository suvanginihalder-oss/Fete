import React from "react";
import { Activity, Flame, Shield, Wind } from "lucide-react";
import type { CurrentPollutants } from "../types/index.js";

interface PollutantCardsProps {
  pollutants: CurrentPollutants;
}

export const PollutantCards: React.FC<PollutantCardsProps> = ({
  pollutants,
}) => {
  const cards = [
    {
      name: "PM2.5 (Fine Particulate)",
      value: `${pollutants.pm2_5} µg/m³`,
      description:
        "Particles <2.5 µm that penetrate deep into lungs and bloodstream.",
      safeLimit: "CPCB 24h: 60 | WHO: 15",
      icon: Activity,
      color: pollutants.pm2_5 > 60 ? "text-rose-600" : "text-emerald-600",
    },
    {
      name: "PM10 (Coarse Dust)",
      value: `${pollutants.pm10} µg/m³`,
      description:
        "Road dust, construction and ash particles causing airway irritation.",
      safeLimit: "CPCB 24h: 100 | WHO: 45",
      icon: Wind,
      color: pollutants.pm10 > 100 ? "text-amber-600" : "text-emerald-600",
    },
    {
      name: "NO₂ (Nitrogen Dioxide)",
      value: `${pollutants.nitrogen_dioxide} µg/m³`,
      description: "Emissions from diesel and petrol vehicular exhaust.",
      safeLimit: "CPCB 24h: 80 | WHO: 25",
      icon: Flame,
      color:
        pollutants.nitrogen_dioxide > 80 ? "text-rose-600" : "text-slate-700",
    },
    {
      name: "Ozone (O₃)",
      value: `${pollutants.ozone} µg/m³`,
      description: "Secondary photochemical smog formed by heat and sunlight.",
      safeLimit: "CPCB 8h: 100 | WHO: 100",
      icon: Shield,
      color: pollutants.ozone > 100 ? "text-amber-600" : "text-slate-700",
    },
  ];

  return (
    <section aria-labelledby="pollutants-heading" className="mt-6">
      <h2
        id="pollutants-heading"
        className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2"
      >
        <Activity className="w-4 h-4 text-emerald-600" aria-hidden="true" />
        Key Atmospheric Pollutants Breakdown
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                  <span>{c.name}</span>
                  <Icon className="w-4 h-4 text-slate-400" aria-hidden="true" />
                </div>
                <div
                  className={`text-2xl font-black ${c.color} my-1 font-mono`}
                >
                  {c.value}
                </div>
                <p className="text-xs text-slate-600 leading-snug">
                  {c.description}
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 text-[10px] text-slate-600 font-mono">
                {c.safeLimit}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
