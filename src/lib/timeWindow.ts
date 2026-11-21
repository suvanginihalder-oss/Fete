import type { HourlyForecastItem, TimeWindows } from "../types/index.js";

/**
 * Analyzes the 48-hour forecast to find optimal and dangerous windows.
 * In severe winter smog, diurnal temperature inversions usually trap peak pollution
 * during late night and early morning (4 AM - 8 AM), while solar heating and surface winds
 * create the lowest particulate concentration during afternoon hours (12 PM - 3 PM).
 */
export function analyzeTimeWindows(hourly: HourlyForecastItem[]): TimeWindows {
  if (!hourly || hourly.length === 0) {
    return {
      bestOutdoorWindow: {
        start: "13:00",
        end: "15:00",
        avgAqi: 150,
        avgPm25: 65,
        explanation:
          "Afternoon sun creates surface mixing, dispersing the ground-level inversion layer.",
      },
      bestVentilationWindow: {
        start: "13:00",
        end: "15:00",
        avgPm25: 65,
        explanation:
          "Brief window cracking during the lowest ambient PM2.5 period clears indoor CO2.",
      },
      worstWindow: {
        start: "06:00",
        end: "09:00",
        peakPm25: 320,
        explanation:
          "Morning thermal inversion traps heavy vehicle exhaust and particulate plumes.",
      },
    };
  }

  // Look across the next 24 hours first (first 24 items)
  const windowSlice = hourly.slice(0, 24);

  // Find 3-hour sliding window with lowest average PM2.5
  let minAvgPm25 = Infinity;
  let bestWindowStartIdx = 0;
  const windowSize = 3;

  for (let i = 0; i <= windowSlice.length - windowSize; i++) {
    const currentSlice = windowSlice.slice(i, i + windowSize);
    const avg =
      currentSlice.reduce((sum, item) => sum + item.pm2_5, 0) / windowSize;
    if (avg < minAvgPm25) {
      minAvgPm25 = avg;
      bestWindowStartIdx = i;
    }
  }

  const bestItems = windowSlice.slice(
    bestWindowStartIdx,
    bestWindowStartIdx + windowSize,
  );
  const bestStart = new Date(bestItems[0].time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const bestEnd = new Date(
    bestItems[bestItems.length - 1].time,
  ).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const avgAqi = Math.round(
    bestItems.reduce((s, it) => s + it.aqi, 0) / windowSize,
  );

  // Find worst single peak or 3-hour window
  let maxAvgPm25 = -1;
  let worstWindowStartIdx = 0;

  for (let i = 0; i <= windowSlice.length - windowSize; i++) {
    const currentSlice = windowSlice.slice(i, i + windowSize);
    const avg =
      currentSlice.reduce((sum, item) => sum + item.pm2_5, 0) / windowSize;
    if (avg > maxAvgPm25) {
      maxAvgPm25 = avg;
      worstWindowStartIdx = i;
    }
  }

  const worstItems = windowSlice.slice(
    worstWindowStartIdx,
    worstWindowStartIdx + windowSize,
  );
  const worstStart = new Date(worstItems[0].time).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const worstEnd = new Date(
    worstItems[worstItems.length - 1].time,
  ).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const peakPm25 = Math.round(Math.max(...worstItems.map((it) => it.pm2_5)));

  return {
    bestOutdoorWindow: {
      start: bestStart,
      end: bestEnd,
      avgAqi,
      avgPm25: Math.round(minAvgPm25),
      explanation: `Lowest forecast PM2.5 levels (~${Math.round(minAvgPm25)} µg/m³) occur around ${bestStart} - ${bestEnd} as boundary layer mixing peaks.`,
    },
    bestVentilationWindow: {
      start: bestStart,
      end: bestEnd,
      avgPm25: Math.round(minAvgPm25),
      explanation: `If ventilating to flush CO2, crack windows only between ${bestStart} and ${bestEnd} for 15–20 minutes with high purifier airflow.`,
    },
    worstWindow: {
      start: worstStart,
      end: worstEnd,
      peakPm25,
      explanation: `Peak smog concentration (~${peakPm25} µg/m³) expected around ${worstStart} - ${worstEnd}. Strictly keep windows sealed and avoid outdoor exertion.`,
    },
  };
}
