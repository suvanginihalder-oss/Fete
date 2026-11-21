import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import http from 'node:http';
import { POPULAR_INDIAN_CITIES, findIndexedCity } from './src/lib/cityIndex.js';

function devApiPlugin() {
  const localCache = new Map<string, { data: any; exp: number }>();

  return {
    name: 'dev-api-middleware',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const urlObj = new URL(req.url, 'http://localhost:5173');
        const pathname = urlObj.pathname;

        if (pathname === '/api/air-quality') {
          const cityQuery = (urlObj.searchParams.get('city') || 'Delhi').trim();
          const cacheKey = cityQuery.toLowerCase();

          // Check in-memory fast cache
          const hit = localCache.get(cacheKey);
          if (hit && Date.now() < hit.exp) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(hit.data));
          }

          try {
            let lat = 28.65;
            let lon = 77.23;
            let resolvedName = 'Delhi';
            let tz = 'Asia/Kolkata';

            // Fast indexed lookup
            const found = findIndexedCity(cityQuery);
            if (found) {
              lat = found.latitude;
              lon = found.longitude;
              resolvedName = found.city;
              tz = found.timezone;
            } else {
              const geoRes = await new Promise<any>((resolve, reject) => {
                http.get(`http://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityQuery)}&count=1&language=en&format=json`, (r) => {
                  let data = '';
                  r.on('data', c => data += c);
                  r.on('end', () => resolve(JSON.parse(data)));
                }).on('error', reject);
              });

              if (!geoRes.results || geoRes.results.length === 0) {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ error: `City "${cityQuery}" not found` }));
              }

              lat = geoRes.results[0].latitude;
              lon = geoRes.results[0].longitude;
              resolvedName = geoRes.results[0].name;
              tz = geoRes.results[0].timezone || 'Asia/Kolkata';
            }

            // Fetch live air quality
            const aqRes = await new Promise<any>((resolve, reject) => {
              http.get(`http://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm10,pm2_5&forecast_days=2&timezone=${encodeURIComponent(tz)}`, (r) => {
                let data = '';
                r.on('data', c => data += c);
                r.on('end', () => resolve(JSON.parse(data)));
              }).on('error', reject);
            });

            const cur = aqRes.current;
            const curP = {
              pm2_5: Math.round(cur?.pm2_5 ?? 0),
              pm10: Math.round(cur?.pm10 ?? 0),
              nitrogen_dioxide: Math.round(cur?.nitrogen_dioxide ?? 0),
              sulphur_dioxide: Math.round(cur?.sulphur_dioxide ?? 0),
              ozone: Math.round(cur?.ozone ?? 0),
              carbon_monoxide: Math.round(cur?.carbon_monoxide ?? 0)
            };

            const pm25Sub = Math.min(500, Math.round((curP.pm2_5 / 30) * 50));
            const pm10Sub = Math.min(500, Math.round((curP.pm10 / 50) * 50));
            const aqiVal = Math.max(pm25Sub, pm10Sub);
            const bandVal = aqiVal <= 50 ? 'Good' : aqiVal <= 100 ? 'Satisfactory' : aqiVal <= 200 ? 'Moderate' : aqiVal <= 300 ? 'Poor' : aqiVal <= 400 ? 'Very Poor' : 'Severe';

            const hourlyItems = (aqRes.hourly?.time || []).map((t: string, i: number) => {
              const p25 = Math.round(aqRes.hourly.pm2_5[i] ?? 0);
              const p10 = Math.round(aqRes.hourly.pm10[i] ?? 0);
              return {
                time: t,
                pm2_5: p25,
                pm10: p10,
                aqi: Math.max(Math.min(500, Math.round((p25 / 30) * 50)), Math.min(500, Math.round((p10 / 50) * 50))),
                band: bandVal
              };
            });

            const payload = {
              city: resolvedName,
              latitude: lat,
              longitude: lon,
              timezone: tz,
              timestamp: cur?.time || new Date().toISOString(),
              current: curP,
              aqi: {
                aqi: aqiVal,
                band: bandVal,
                prominentPollutant: pm25Sub >= pm10Sub ? 'PM2.5' : 'PM10',
                subIndices: { pm25: pm25Sub, pm10: pm10Sub },
                whoComparisons: {
                  pm25Ratio: Number((curP.pm2_5 / 15).toFixed(1)),
                  pm10Ratio: Number((curP.pm10 / 45).toFixed(1)),
                  pm25Exceeds: curP.pm2_5 > 15,
                  pm10Exceeds: curP.pm10 > 45
                }
              },
              hourly: hourlyItems,
              sourceAttribution: 'Air quality data by Open-Meteo.com, CAMS ENSEMBLE data provider',
              isModelledEstimate: true,
              gridResolutionKm: 11
            };

            // Cache 15 minutes
            localCache.set(cacheKey, { data: payload, exp: Date.now() + 15 * 60 * 1000 });

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(payload));
          } catch (e: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ error: e?.message || 'Server error' }));
          }
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), devApiPlugin()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**']
    }
  }
});
