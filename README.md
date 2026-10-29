# CelebrAI — Parallel GenAI Event Blueprint Architect

> **Live Demo Ready** • Zero-Setup Visitor Experience • Guaranteed 4-Minute Core Flow • Demo Safety Mode (Zero Flaky API Risk)

---

## 1. Problem
Traditional event planning applications suffer from three critical bottlenecks:
1. **Monolithic LLM Timeouts**: Generating a 20-page event plan in a single prompt takes 35–60+ seconds, consistently hitting serverless function timeouts (10s on Vercel hobby tiers).
2. **LLM Mathematical Hallucinations**: Language models routinely fail at basic addition—budget lines often do not sum to the allocated budget, creating penny-loss discrepancies and rounding errors.
3. **Flaky Demo Fragility**: In live demos and judging sessions, external API rate limits, expired keys, or provider outages cause white screens of death or broken forms.

---

## 2. Solution: CelebrAI
CelebrAI reimagines event planning with a **Parallel Sectioned Architecture**, **Code-Owned Mathematics**, and an automatic **Demo Safety Guard**:

```
                       User Event Form Input
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
   [Serverless Route: /api/generate-plan]   [Offline / Demo Fallback Guard]
               │                                 │
     4 Concurrent Worker Streams                 │
   ┌───────────┬───────────┬───────────┐         │
   ▼           ▼           ▼           ▼         │
Section A   Section B   Section C   Section D    │
 Concept     Budget      Timeline    Vendors     │
   │           │           │           │         │
   └─────┬─────┴─────┬─────┴─────┬─────┘         │
         │           │           │               │
         ▼           ▼           ▼               ▼
   [Zod Schema Validation & Retry Guard] ◄───────┘
                     │
                     ▼
   [Deterministic Code-Owned Math Engine]
     • Exact-to-the-cent budget line rescaling
     • Calendar date conversions & timeline compression
     • Guest per-head costs & dietary aggregations
                     │
                     ▼
   [CelebrAI Interactive Event Command Center]
     • What-If Budget Slider (instant client-side recalcs)
     • Context-Aware Assistant (1-click apply-able diffs)
     • Compressed Read-Only URLs (lz-string, zero-backend)
     • WhatsApp Invitations, CSV/JSON Backup, Print/PDF
```

---

## 3. Key Feature Matrix

| Feature | Description | Architecture / Implementation |
| :--- | :--- | :--- |
| **4 Parallel Section Calls** | Concept, Budget, Timeline & Schedule, Vendors & Contingency | Parallel `Promise.all` with progressive skeleton rendering and per-section retries |
| **Code-Owned Math** | Penny-perfect budget rescaling and integer distribution | Pure TypeScript engine (`src/lib/math.ts`) tested with Vitest |
| **Budget What-If Slider** | Real-time budget simulation without AI re-calls | Instantly re-calculates line items, percentages, and warnings client-side |
| **Timeline Compression** | Converts offset days to real dates & flags overdue tasks | Detects short preparation windows and compresses milestones |
| **Guest & RSVP Costing** | Headcount metrics and auto-calculated per-head cost | Computes `Total Budget / Effective Headcount` + dietary breakdowns |
| **Context-Aware AI Chat** | Conversational planner with 1-click diff application | Suggests structural diffs; applying re-runs budget math automatically |
| **Invitation Suite** | Multi-tone copy generator (Formal, Casual, Poetic, Funky) | One-click clipboard copy and direct WhatsApp Web/App prefilled link |
| **Zero-Backend Sharing** | Shareable read-only URLs without accounts or database | `lz-string` URI-safe compression encoded in browser query strings |
| **Full Local Persistence** | All events saved in browser storage | `localStorage` abstraction layer with JSON export and import backups |
| **Print / PDF View** | Clean printable event summary | Dedicated CSS print styles (`@media print`) stripping UI chrome |

---

## 4. How GenAI is Used (Architecture Deep Dive)

### A. Parallel Section Calls (Avoiding Serverless Timeouts)
Instead of requesting one giant JSON blob that triggers a 504 Gateway Timeout, CelebrAI issues four lightweight concurrent queries:
1. **Section A (Concept & Theming)**: Tagline, decor shares, culinary highlights, entertainment, and crowd activities.
2. **Section B (Budget Allocations)**: Category-specific expenditure weights, cheaper alternatives, and potential savings.
3. **Section C (Timeline & Run Sheet)**: Chronological preparation tasks (`dueOffsetDays`) and minute-by-minute event-day schedule.
4. **Section D (Vendors & Plan B)**: Service ranges, vendor negotiation questions, expert coordinator tips, and weather contingencies.

### B. Strict Schema Validation (`zod`)
Every section response is parsed against strict Zod schemas (`src/lib/schemas.ts`). If a payload fails validation, an automated retry fires immediately before falling back to local deterministic blueprints.

### C. Code Owns The Math (Critical)
LLMs cannot be trusted with financial figures. CelebrAI's `rescaleBudgetLines` function takes the AI's percentage guidance and rescales integer allocations to sum **EXACTLY** to the user's total budget. Any rounding discrepancy is programmatically applied to the highest-weight category, guaranteeing 0.00% delta.

---

## 5. Demo Safety & Cost Control
- **Rate-Limiting & Request Quotas**: Per-IP throttling prevents abuse and budget spikes.
- **Auto Fallback to Demo Mode**: If API quotas, timeouts, or network failures occur, the app seamlessly switches to high-fidelity mock generators with a prominent indicator banner:
  > `"Sample plan, not live AI (Protected by Demo Safety Mode)"`
- **One-Click Sample Event**: The seed example (**Aura '26 College Cultural Fest**, 250 guests, ₹50,000 budget, 1 month away) is bundled locally and loads in **under 100 milliseconds** with zero external API calls.

---

## 6. Project Structure

```
celebr-ai/
├── api/
│   ├── generate-plan.ts      # Vercel serverless parallel planner route
│   └── chat.ts               # Context-aware chat route with diff generator
├── src/
│   ├── components/
│   │   ├── tabs/
│   │   │   ├── ConceptTab.tsx      # Decor, catering, entertainment & activities
│   │   │   ├── BudgetTab.tsx       # Recharts charts, what-if slider, editable table
│   │   │   ├── TimelineTab.tsx     # Checklist, overdue flags, event-day schedule
│   │   │   ├── GuestTrackerTab.tsx # Headcount metrics, per-head cost, dietary counts
│   │   │   ├── VendorsTab.tsx      # Vendor questions, status toggles, weather Plan B
│   │   │   └── InvitationsTab.tsx  # Tone selector, WhatsApp link, shareable URL
│   │   ├── ChatAssistantDrawer.tsx # Context-aware drawer with 1-click apply diffs
│   │   ├── EventFormModal.tsx      # Validated event input form with accessibility
│   │   ├── LandingHero.tsx         # Welcome hero & instant demo triggers
│   │   ├── Navbar.tsx              # Brand bar, sample loader & saved events drawer
│   │   ├── PlanHeader.tsx          # Countdown, quick metrics & action toolbar
│   │   ├── PlanProgressModal.tsx   # Progressive skeletons & per-section retry
│   │   ├── SavedPlansDrawer.tsx    # Local event manager & persistence
│   │   └── Toast.tsx               # ARIA-live alert notifications
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── providerAdapter.ts  # Unified Gemini / Claude / OpenAI adapter
│   │   │   ├── demoGenerator.ts    # Guaranteed offline mock generator
│   │   │   └── parallelPlanner.ts  # Concurrent worker runner & retries
│   │   ├── math.ts                 # Code-owned budget rescaling & date conversions
│   │   ├── sampleData.ts           # College Cultural Fest "Aura '26" seed
│   │   ├── schemas.ts              # Zod validation schemas
│   │   ├── sharing.ts              # lz-string compression & WhatsApp generator
│   │   └── storage.ts              # LocalStorage manager & rate-quota guards
│   ├── tests/
│   │   └── math.test.ts            # Vitest unit test suite (budget, dates, guests)
│   ├── types/
│   │   └── index.ts                # TypeScript domain models
│   ├── App.tsx                     # Main application orchestrator
│   ├── main.tsx                    # React DOM entry point
│   └── index.css                   # Tailwind styles, print styles & animations
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── vercel.json
```

---

## 7. Setup & Run Locally

### Prerequisites
- Node.js 18+ (tested on Node v20 LTS)
- npm or pnpm

### Quickstart
```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional - Demo mode works with zero keys)
cp .env.example .env

# 3. Run unit tests
npm test

# 4. Start live development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 8. Environment Variables

CelebrAI works 100% out-of-the-box in Demo Mode without setting any environment variables. To enable live AI provider streaming:

```env
# Default provider ('gemini' | 'anthropic' | 'openai')
LLM_PROVIDER=gemini

# Google Gemini API Key (Free tier from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key_here

# Anthropic Claude API Key (Optional)
# ANTHROPIC_API_KEY=your_claude_api_key

# OpenAI API Key (Optional)
# OPENAI_API_KEY=your_openai_api_key
```

---

## 9. Deployment to Vercel

```bash
# Using Vercel CLI:
npm i -g vercel
vercel

# Or via GitHub:
# 1. Push code to your public GitHub repository
# 2. Import project into Vercel Dashboard
# 3. Add GEMINI_API_KEY under Environment Variables (optional)
# 4. Deploy!
```

---

## 10. Honest Limitations & Design Trade-offs
1. **Zero Database / Auth by Design**: To ensure zero friction for first-time visitors and judges, all persistence is stored in browser `localStorage`. Multi-device synchronization requires using the **Share URL** or **JSON Export/Import** features.
2. **Provider Availability**: In live cloud environments, if third-party LLMs rate-limit or fail, CelebrAI transparently serves structured local event plans. A visible banner informs the user that a fallback plan was loaded.
3. **URL Length**: Extremely massive events with >100 custom vendors may produce long shared URLs. `lz-string` compresses the payload by ~65%, keeping links well within modern browser URL limits.

---

## 11. Timed Demo Script (3:30 Total)

- **0:00 - 0:20 (Hook)**:
  - *"Welcome to CelebrAI, the parallel GenAI event architect. Traditional planners crash due to LLM timeouts and hallucinate budget math. CelebrAI solves both with 4 concurrent calls and code-owned math."*
- **0:20 - 1:10 (Form & Parallel Generation)**:
  - Click **"Load Sample Event"** (or fill the validated form). Show the instantaneous loading of **Aura '26 College Cultural Fest** (250 guests, ₹50,000 budget). Highlight the progressive skeleton indicators and zero timeout delay.
- **1:10 - 2:00 (Budget & What-If Slider)**:
  - Navigate to **"Budget & What-If"** tab. Show Recharts category allocations.
  - Drag the **What-If Slider** up and down. Point out how line totals rescale instantly client-side to the exact rupee without any AI calls. Show the **"Apply -₹5,000 Cheaper Alternative"** toggle.
- **2:00 - 2:40 (Checklist & Guest RSVP Costing)**:
  - Navigate to **"Timeline & Schedule"**. Tick off preparation milestones; point out compressed schedule badges and overdue alerts.
  - Switch to **"RSVP & Guests"**. Add a guest with a dietary restriction. Watch the **Per-Head Cost** recalculate dynamically.
- **2:40 - 3:20 (AI Assistant with Diffs & URL Sharing)**:
  - Open **"Ask AI Assistant"**. Click the prompt: *"Find ₹8,000 savings in food & decor"*.
  - Show the returned **Diff Card**. Click **"Apply Changes"**—watch confetti pop and budget math automatically re-balance!
  - Switch to **"Invites & Sharing"**, toggle tone from Formal to Funky, and copy the **Compressed Read-Only URL**.
- **3:20 - 3:30 (Closing)**:
  - Open the generated link in a new private window to prove zero-setup read-only rendering. Conclude on reliability, safety, and speed.

