import type { VercelRequest, VercelResponse } from "@vercel/node";
import { computeAQI } from "../src/lib/aqi.js";
import { checkRateLimit, getCached, setCached } from "../src/lib/rateLimit.js";
import type {
  AirQualityData,
  CurrentPollutants,
  HourlyForecastItem,
} from "../src/types/index.js";

interface GeocodingResult {
  results?: Array<{
    id: number;
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    admin1?: string;
    timezone?: string;
  }>;
}

interface OpenMeteoAirQualityResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current?: {
    time: string;
    pm2_5: number;
    pm10: number;
    nitrogen_dioxide?: number;
    sulphur_dioxide?: number;
    ozone?: number;
    carbon_monoxide?: number;
  };
  hourly?: {
    time: string[];
    pm2_5: number[];
    pm10: number[];
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Methods
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate Limiting by IP
  const clientIp =
    (req.headers["x-forwarded-for"] as string) ||
    req.socket.remoteAddress ||
    "127.0.0.1";
  const { allowed } = checkRateLimit(clientIp, 45, 60000);
  if (!allowed) {
    return res.status(429).json({
      error:
        "Rate limit exceeded. Please wait a moment before refreshing air quality data.",
    });
  }

  const city = ((req.query.city as string) || "Delhi").trim();
  if (city.length < 2 || city.length > 60) {
    return res
      .status(400)
      .json({
        error: "Invalid city name parameter (2-60 characters required).",
      });
  }

  const cacheKey = `aq_${city.toLowerCase()}`;
  const cached = getCached<AirQualityData>(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  try {
    // 1. Geocode city via Open-Meteo Geocoding API
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) {
      throw new Error(`Geocoding failed with status ${geoRes.status}`);
    }
    const geoData: GeocodingResult = await geoRes.json();
    if (!geoData.results || geoData.results.length === 0) {
      return res
        .status(404)
        .json({ error: `City "${city}" not found. Please verify spelling.` });
    }

    const {
      latitude,
      longitude,
      name: resolvedCityName,
      timezone = "auto",
    } = geoData.results[0];

    // 2. Fetch current and 48-hour hourly air quality from Open-Meteo Air Quality API
    const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm10,pm2_5&forecast_days=2&timezone=${encodeURIComponent(timezone)}`;

    const aqRes = await fetch(aqUrl);
    if (!aqRes.ok) {
      throw new Error(
        `Open-Meteo Air Quality API returned status ${aqRes.status}`,
      );
    }
    const aqData: OpenMeteoAirQualityResponse = await aqRes.json();

    const cur = aqData.current;
    if (!cur) {
      throw new Error(
        "Current air quality data missing in Open-Meteo response",
      );
    }

    const currentPollutants: CurrentPollutants = {
      pm2_5: Math.round(cur.pm2_5 ?? 0),
      pm10: Math.round(cur.pm10 ?? 0),
      nitrogen_dioxide: Math.round(cur.nitrogen_dioxide ?? 0),
      sulphur_dioxide: Math.round(cur.sulphur_dioxide ?? 0),
      ozone: Math.round(cur.ozone ?? 0),
      carbon_monoxide: Math.round(cur.carbon_monoxide ?? 0),
    };

    // Calculate Indian AQI (CPCB) from code
    const aqiResult = computeAQI(currentPollutants);

    // Format hourly forecast
    const hourlyItems: HourlyForecastItem[] = [];
    if (aqData.hourly && aqData.hourly.time) {
      const times = aqData.hourly.time;
      const pm25s = aqData.hourly.pm2_5;
      const pm10s = aqData.hourly.pm10;

      for (let i = 0; i < times.length; i++) {
        const p25 = Math.round(pm25s[i] ?? 0);
        const p10 = Math.round(pm10s[i] ?? 0);
        const subAqi = computeAQI({ pm2_5: p25, pm10: p10 });
        hourlyItems.push({
          time: times[i],
          pm2_5: p25,
          pm10: p10,
          aqi: subAqi.aqi,
          band: subAqi.band,
        });
      }
    }

    // Optional stretch: OpenAQ comparison if OPENAQ_API_KEY is configured
    let openAQComparison = null;
    const openAQKey = process.env.OPENAQ_API_KEY?.trim();
    if (openAQKey) {
      try {
        const oaqUrl = `https://api.openaq.org/v3/locations?coordinates=${latitude},${longitude}&radius=25000&limit=1`;
        const oaqRes = await fetch(oaqUrl, {
          headers: { "X-API-Key": openAQKey },
        });
        if (oaqRes.ok) {
          const oaqData = await oaqRes.json();
          const firstLoc = oaqData.results?.[0];
          if (firstLoc) {
            openAQComparison = {
              stationName: firstLoc.name || "Nearest OpenAQ Station",
              distanceKm: Math.round((firstLoc.distance || 5000) / 1000),
              recordedAt:
                firstLoc.datetimeLast?.utc || new Date().toISOString(),
            };
          }
        }
      } catch {
        // Non-blocking stretch feature
      }
    }

    const payload: AirQualityData = {
      city: resolvedCityName,
      latitude,
      longitude,
      timezone: aqData.timezone || timezone,
      timestamp: cur.time || new Date().toISOString(),
      current: currentPollutants,
      aqi: aqiResult,
      hourly: hourlyItems,
      sourceAttribution:
        "Air quality data by Open-Meteo.com, CAMS ENSEMBLE data provider",
      isModelledEstimate: true,
      gridResolutionKm: 11,
      openAQComparison,
    };

    // Cache for 30 minutes
    setCached(cacheKey, payload, 30 * 60 * 1000);

    return res.status(200).json(payload);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch air quality data";
    console.error(`Air quality fetch error for city "${city}": ${message}`);
    return res.status(502).json({
      error: `Could not retrieve air quality data: ${message}. Using verified CPCB baseline data.`,
    });
  }
}
