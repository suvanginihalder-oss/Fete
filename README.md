# AirWise 🌬️
**Urban Air Quality & Severe Winter Smog Defence Assistant**
*Built for PromptWars Virtual Challenge 06: "Help families beat severe winter smog with personalized low-emission routines and indoor air hacks."*

Live Public URL: **[https://airwise-urban.vercel.app](https://airwise-urban.vercel.app)** *(Zero setup required for first-time visitors)*  
Public GitHub Repository: **[https://github.com/suvanginihalder-oss/airwise](https://github.com/suvanginihalder-oss/airwise)**

---

## 1. Problem Statement
Every winter across northern India and industrial urban centers, atmospheric temperature inversions trap vehicular exhaust, biomass burning, and road dust at ground level. Families face severe air quality indices (AQI 350–500+) leading to acute respiratory stress for children, pregnant women, and the elderly. 

Most existing weather apps offer passive alarmism without actionable indoor protection protocols or practical low-emission commute alternatives. Furthermore, many commercial products promote unscientific myths (e.g., claiming houseplants can scrub PM2.5 particles).

**AirWise** bridges this gap by combining real meteorological dispersion data with deterministic CPCB safety baselines and strictly controlled Gemini AI personalization.

---

## 2. Core Solution & Principles
1. **Real Data, Never Invented**: The AI **never** calculates or invents pollution figures. Deterministic TypeScript functions fetch, calculate, and normalize every pollutant number and CPCB sub-index. The AI only writes customized routines based on verified numbers injected into prompts.
2. **Scientific Honesty & Source Transparency**: 
   - Explicit attribution displayed: *"Air quality data by Open-Meteo.com, CAMS ENSEMBLE data provider"*.
   - Clearly discloses that values represent modelled grid estimates (~11 km grid resolution), not ground station monitors.
   - De-bunks myths: frankly explains that while indoor plants provide oxygen and trace VOC removal, they **cannot** physically filter fine PM2.5 particles.
3. **Not Medical Advice**: Permanent prominent disclaimer displayed alongside all guidance: *"General guidance, not medical advice. Consult a medical professional for clinical symptoms."*
4. **Resilient Offline Utility (Zero-AI Fallback)**: The app remains 100% functional without AI. If Gemini hits rate limits or is offline, a deterministic baseline engine renders verified CPCB guidance immediately with a clear UI banner.

---

## 3. Architecture & Data Pipeline

```mermaid
flowchart TD
    User([User Browser]) -->|City or Share Link| Frontend[React 18 + Vite UI]
    Frontend -->|GET /api/air-quality?city=...| AQRoute[/api/air-quality]
    
    subgraph Data Pipeline [Code Owns The Facts]
        AQRoute -->|1. Geocode City| OpenMeteoGeo[Open-Meteo Geocoding API]
        AQRoute -->|2. Fetch 48h PM2.5/PM10/NO2/SO2/CO| OpenMeteoAQ[Open-Meteo & CAMS Ensemble API]
        AQRoute -->|3. Optional Ground Station| OpenAQ[OpenAQ API v3]
        AQRoute -->|4. Compute Indian NAQI| CPCBEngine[CPCB Breakpoint Interpolation]
    end

    AQRoute -->|Cached JSON 30m TTL| Frontend

    subgraph Advice & AI Personalization
        Frontend -->|POST /api/generate-plan| PlanRoute[/api/generate-plan]
        PlanRoute -->|Prompt Injected with Real Facts| Gemini[Google Gemini 2.5 Flash / 1.5 Fallback]
        Gemini -->|Strict Zod JSON Validation| PlanRoute
        PlanRoute -.->|On 429 / Offline| BaselineFallback[Deterministic CPCB Engine]
    end

    Frontend -->|State & Offline Cache| LocalStorage[(Browser LocalStorage & URL LZ-String)]
```

### Key Modules:
- `src/lib/aqi.ts`: Implements official Central Pollution Control Board (CPCB NAQI 2014) linear interpolation breakpoint tables for PM2.5 and PM10 across 6 bands (Good, Satisfactory, Moderate, Poor, Very Poor, Severe), and computes WHO 2021 24-hr guideline exceedance ratios.
- `src/lib/timeWindow.ts`: Analyzes 48-hour hourly curves to locate diurnal solar mixing windows (typically 12 PM - 3 PM) for safe window ventilation, and warns against morning inversion smog spikes (5 AM - 9 AM).
- `src/lib/baselineAdvice.ts`: Code-generated deterministic safety advice by AQI band (N95 mask protocols, school sports policy, indoor filtration rules).
- `src/lib/emissions.ts`: Calculates personal carbon and pollutant savings (kg CO2e) for commute swaps using verified ARAI/CPCB transport carbon intensities.
- `src/lib/storage.ts`: Seamless URL sharing via `lz-string` compression with zero database requirement.

---

## 4. Key Features
- **Live Smog Advisory Banner**: Automatically triggers high-contrast emergency guidance when AQI exceeds 200 (Poor, Very Poor, Severe).
- **CPCB NAQI Meter & Pollutant Breakdown**: Instant visual gauge, prominent pollutant identification, and comparisons against WHO 2021 air quality thresholds.
- **Diurnal Forecast & Inversion Windows**: 48-hour Recharts forecast with screen-reader accessible summaries identifying the safest and most hazardous time windows.
- **Personalized Low-Emission Routine (Interactive Checklist)**: Morning, commute, and evening tickable actions persisted in local storage.
- **Indoor Air Hacks**: Instructions for building an emergency Corsi-Rosenthal / DIY HEPA fan filter, thermal inversion window opening timing, and zero-smoke kitchen protocols.
- **Ask AI Chat Drawer**: Interactive assistant with suggested prompt chips and instant answers grounded in current city readings.
- **Privacy-First & Shareable**: Instant URL profile compression, print / PDF export, and no account registration required.

---

## 5. Accessibility (WCAG 2.1 AA Compliant)
- Skip link (`#main-content`) for instant keyboard bypass of headers.
- ARIA tablist (`role="tablist"`, `aria-selected`, keyboard focus management).
- Modal dialogs with `role="dialog"`, `aria-modal="true"`, focus trapping, and `Escape` key listeners.
- High-contrast visual tokens (exceeding 4.5:1 ratio) with both text labels and iconography for all AQI bands.
- Screen-reader text summaries for SVG charts (`role="img"`).

---

## 6. Environment Variables (.env.example)

```env
# Gemini API Key (Required for AI advice & chat personalization)
# Free key available at Google AI Studio: https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here

# Primary & Fallback Models
GEMINI_MODEL=gemini-2.5-flash
GEMINI_FALLBACK_MODELS=gemini-2.5-flash,gemini-1.5-flash,gemini-1.5-pro

# Provider
LLM_PROVIDER=gemini

# Optional: OpenAQ API key for station comparison
OPENAQ_API_KEY=
```

---

## 7. Local Development & Testing

```bash
# Clone the repository
git clone https://github.com/suvanginihalder-oss/airwise.git
cd airwise

# Install dependencies
npm install

# Run unit tests with code coverage (Vitest)
npm run test:coverage

# Run ESLint (TypeScript-ESLint)
npm run lint

# Format code (Prettier)
npm run format

# Run local Vite development server
npm run dev

# Build for production
npm run build
```

---

## 8. Deployment on Vercel
1. Fork or push this repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Framework Preset: **Vite**.
4. Configure Environment Variables in the Vercel dashboard:
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` = `gemini-2.5-flash`
   - `GEMINI_FALLBACK_MODELS` = `gemini-2.5-flash,gemini-1.5-flash,gemini-1.5-pro`
5. Deploy. Serverless API routes in `/api` will deploy automatically with 30s timeout configured in `vercel.json`.

---

## 9. 3:30 Product Walkthrough Demo Script
- **0:00 - 0:30 (The Winter Smog Crisis)**: Introduce severe winter smog in Delhi / urban centers (AQI 350+). Show the live landing page with instant sample cities. Highlight the severe smog advisory banner and required Open-Meteo/CAMS attribution.
- **0:30 - 1:15 (Real Data & Inversion Windows)**: Explain that code owns all numbers—no AI hallucination. Walk through the CPCB NAQI gauge, WHO 2021 comparisons (12x limit), and the 48h forecast chart highlighting the 1 PM - 3 PM safe window vs 6 AM inversion peak.
- **1:15 - 2:15 (My Plan & Low-Emission Routines)**: Switch to "My Plan". Show the personalized advice for children and asthma patients, interactive morning/commute/evening checklists, and the DIY Corsi-Rosenthal HEPA box hack. Highlight the plant myth explainer.
- **2:15 - 2:50 (Ask AI Assistant & Offline Resilience)**: Open the chat drawer. Ask: *"When can I open my windows today?"* Show concise, grounded advice. Note that if offline or rate-limited, deterministic fallbacks ensure zero interruption.
- **2:50 - 3:30 (Household Customization & Sharing)**: Open the Household Profile modal, modify family members and commute distance, save, and show the instant routine update. Demonstrate the one-click compressed share link and print-friendly export.

