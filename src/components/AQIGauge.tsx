import React from "react";
import {
  Wind,
  Gauge,
  ShieldAlert,
  Sparkles,
  MapPin,
  Clock,
} from "lucide-react";
import { getBandDetails } from "../lib/aqi.js";
import type { AirQualityData } from "../types/index.js";

interface AQIGaugeProps {
  data: AirQualityData;
}

export const AQIGauge: React.FC<AQIGaugeProps> = ({ data }) => {
  const { aqi, band, prominentPollutant, whoComparisons } = data.aqi;
  const bandStyle = getBandDetails(band);

  // Meter percentage (0 to 500 max)
  const percent = Math.min(100, Math.round((aqi / 500) * 100));

  return (
    <section
      aria-labelledby="aqi-gauge-heading"
      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-emerald-600" aria-hidden="true" />
          <h2
            id="aqi-gauge-heading"
            className="text-xl font-bold text-slate-800"
          >
            {data.city} Air Quality Index
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Clock className="w-3.5 h-3.5" aria-hidden="true" />
          <span>
            Reading:{" "}
            {new Date(data.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Main AQI Number and Band */}
        <div className="md:col-span-5 flex flex-col items-center justify-center text-center p-6 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-slate-400" aria-hidden="true" /> CPCB
            NAQI Standard
          </span>
          <div className="text-6xl font-black text-slate-900 tracking-tight my-1">
            {aqi}
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${bandStyle.bgColor} ${bandStyle.textColor} ${bandStyle.borderColor} mt-1`}
          >
            <ShieldAlert className="w-4 h-4" aria-hidden="true" />
            <span>{band}</span>
          </div>
          <span className="text-xs text-slate-500 mt-2">
            Primary Driver:{" "}
            <strong className="text-slate-800">{prominentPollutant}</strong>
          </span>

          {/* Visual Gauge Meter */}
          <div className="w-full mt-4" aria-hidden="true">
            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden flex">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${percent}%`,
                  backgroundColor: bandStyle.color,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-mono font-semibold">
              <span>0 (Good)</span>
              <span>100</span>
              <span>200</span>
              <span>300</span>
              <span>500 (Severe)</span>
            </div>
          </div>
        </div>

        {/* Health Impact & WHO Guideline Check */}
        <div className="md:col-span-7 flex flex-col justify-between h-full space-y-4">
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/60">
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" aria-hidden="true" />{" "}
              Health Impact Summary
            </h3>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              {bandStyle.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <div className="text-[11px] text-slate-700 font-semibold">
                PM2.5 vs WHO Limit
              </div>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {whoComparisons.pm25Ratio}x
              </div>
              <p className="text-[10px] text-slate-600 mt-0.5">
                {data.current.pm2_5} µg/m³ (WHO limit: 15 µg/m³)
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
              <div className="text-[11px] text-slate-700 font-semibold">
                PM10 vs WHO Limit
              </div>
              <div className="text-2xl font-black text-amber-600 mt-1">
                {whoComparisons.pm10Ratio}x
              </div>
              <p className="text-[10px] text-slate-600 mt-0.5">
                {data.current.pm10} µg/m³ (WHO limit: 45 µg/m³)
              </p>
            </div>
          </div>

          {/* Modelled Grid Disclaimer */}
          <div className="text-[11px] text-slate-600 leading-tight bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-start gap-2">
            <Wind
              className="w-4 h-4 text-slate-600 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span>
              <strong>Modelled estimate note:</strong> Values are derived from
              atmospheric dispersion models (~{data.gridResolutionKm} km grid)
              by CAMS ENSEMBLE, not ground monitor stations.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
