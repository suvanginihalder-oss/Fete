import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Clock, Sun, AlertOctagon } from "lucide-react";
import type { HourlyForecastItem, TimeWindows } from "../types/index.js";

interface ForecastChartProps {
  hourly: HourlyForecastItem[];
  timeWindows: TimeWindows;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  hourly,
  timeWindows,
}) => {
  // Take first 24-48 hours and format timestamps for display
  const chartData = (hourly || []).slice(0, 36).map((item) => {
    const d = new Date(item.time);
    return {
      timeLabel: d.toLocaleTimeString([], { hour: "numeric", hour12: true }),
      fullTime: d.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      pm25: item.pm2_5,
      pm10: item.pm10,
      aqi: item.aqi,
      band: item.band,
    };
  });

  return (
    <section
      aria-labelledby="forecast-heading"
      className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mt-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2
            id="forecast-heading"
            className="text-lg font-bold text-slate-800 flex items-center gap-2"
          >
            <Clock className="w-5 h-5 text-emerald-600" aria-hidden="true" />
            48-Hour PM2.5 & Smog Diurnal Forecast
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hourly particulate concentration trend based on atmospheric
            dispersion modelling.
          </p>
        </div>
      </div>

      {/* Screen Reader Accessible Summary */}
      <div className="sr-only">
        Air quality 48 hour forecast: Optimal window for outdoor activities and
        window ventilation is between {timeWindows.bestOutdoorWindow.start} and{" "}
        {timeWindows.bestOutdoorWindow.end} with average PM2.5 of{" "}
        {timeWindows.bestOutdoorWindow.avgPm25} micrograms per cubic meter. The
        worst smog window is between {timeWindows.worstWindow.start} and{" "}
        {timeWindows.worstWindow.end} with peak PM2.5 reaching{" "}
        {timeWindows.worstWindow.peakPm25} micrograms per cubic meter.
      </div>

      {/* Best & Worst Time Window Chips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3">
          <Sun
            className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <div className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
              Best Outdoor & Ventilation Window
            </div>
            <div className="text-lg font-black text-emerald-950 mt-0.5">
              {timeWindows.bestOutdoorWindow.start} –{" "}
              {timeWindows.bestOutdoorWindow.end}
            </div>
            <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
              {timeWindows.bestOutdoorWindow.explanation}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 flex items-start gap-3">
          <AlertOctagon
            className="w-5 h-5 text-rose-700 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div>
            <div className="text-xs font-bold text-rose-900 uppercase tracking-wide">
              Worst Smog (Inversion Peak)
            </div>
            <div className="text-lg font-black text-rose-950 mt-0.5">
              {timeWindows.worstWindow.start} – {timeWindows.worstWindow.end}
            </div>
            <p className="text-xs text-rose-800 mt-1 leading-relaxed">
              {timeWindows.worstWindow.explanation}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Chart with role="img" and accessible label */}
      <div
        role="img"
        aria-label="Interactive graph displaying 48-hour PM2.5 particulate concentration"
        className="w-full h-72"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="pm25Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ea580c" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ea580c" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              vertical={false}
            />
            <XAxis
              dataKey="timeLabel"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
            />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} unit=" µg" />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white text-xs p-3 rounded-lg shadow-lg border border-slate-700">
                      <div className="font-bold text-slate-200 mb-1">
                        {d.fullTime}
                      </div>
                      <div className="text-amber-400 font-mono">
                        PM2.5: {d.pm25} µg/m³
                      </div>
                      <div className="text-slate-300 font-mono">
                        AQI: ~{d.aqi} ({d.band})
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="pm25"
              stroke="#ea580c"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#pm25Gradient)"
              name="PM2.5"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
