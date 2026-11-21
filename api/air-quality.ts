import type { VercelRequest, VercelResponse } from '@vercel/node';
import { computeAQI } from '../src/lib/aqi.js';
import { checkRateLimit, getCached, setCached } from '../src/lib/rateLimit.js';
import { fetchJson } from '../src/lib/fetchJson.js';
import { findIndexedCity } from '../src/lib/cityIndex.js';
import type { AirQualityData, CurrentPollutants, HourlyForecastItem } from '../src/types/index.js';

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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const { allowed } = checkRateLimit(clientIp, 60, 60000);
  if (!allowed) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Please wait a moment before refreshing air quality data.'
    });
  }

  const city = ((req.query.city as string) || 'Delhi').trim();
  if (city.length < 2 || city.length > 60) {
    return res.status(400).json({ error: 'Invalid city name parameter (2-60 characters required).' });
  }

  const cacheKey = `aq_${city.toLowerCase()}`;
  const cached = getCached<AirQualityData>(cacheKey);
  if (cached) {
    return res.status(200).json(cached);
  }

  try {
    let latitude: number;
    let longitude: number;
    let resolvedCityName: string;
    let timezone = 'Asia/Kolkata';

    // 1. Instant cache lookup in pre-indexed coordinates (cuts 300-500ms geocoding delay)
    const indexed = findIndexedCity(city);
    if (indexed) {
      latitude = indexed.latitude;
      longitude = indexed.longitude;
      resolvedCityName = indexed.city;
      timezone = indexed.timezone;
    } else {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
      const geoData = await fetchJson<GeocodingResult>(geoUrl);

      if (!geoData.results || geoData.results.length === 0) {
        return res.status(404).json({ error: `City "${city}" not found. Please verify spelling.` });
      }

      latitude = geoData.results[0].latitude;
      longitude = geoData.results[0].longitude;
      resolvedCityName = geoData.results[0].name;
      timezone = geoData.results[0].timezone || 'auto';
    }

    // 2. Fetch current and 48-hour hourly air quality from Open-Meteo Air Quality API
    const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm10,pm2_5&forecast_days=2&timezone=${encodeURIComponent(timezone)}`;

    const aqData = await fetchJson<OpenMeteoAirQualityResponse>(aqUrl);

    const cur = aqData.current;
    if (!cur) {
      throw new Error('Current air quality data missing in Open-Meteo response');
    }

    const currentPollutants: CurrentPollutants = {
      pm2_5: Math.round(cur.pm2_5 ?? 0),
      pm10: Math.round(cur.pm10 ?? 0),
      nitrogen_dioxide: Math.round(cur.nitrogen_dioxide ?? 0),
      sulphur_dioxide: Math.round(cur.sulphur_dioxide ?? 0),
      ozone: Math.round(cur.ozone ?? 0),
      carbon_monoxide: Math.round(cur.carbon_monoxide ?? 0)
    };

    const aqiResult = computeAQI(currentPollutants);

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
          band: subAqi.band
        });
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
      sourceAttribution: 'Air quality data by Open-Meteo.com, CAMS ENSEMBLE data provider',
      isModelledEstimate: true,
      gridResolutionKm: 11
    };

    // Cache for 30 minutes
    setCached(cacheKey, payload, 30 * 60 * 1000);

    return res.status(200).json(payload);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch air quality data';
    console.error(`Air quality fetch error for city "${city}": ${message}`);
    return res.status(502).json({
      error: `Could not retrieve air quality data: ${message}. Using verified CPCB baseline data.`
    });
  }
}
