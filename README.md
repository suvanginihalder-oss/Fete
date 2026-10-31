# CelebrAI: Parallel GenAI Event Blueprint Architect

> Built for **PromptWars Virtual, Challenge 5: Celebration & Event Planner**

🌐 **Live app:** https://fete-pink.vercel.app/
🎥 **Demo video:** https://youtu.be/bPFy4jb50o0

![CelebrAI budget tab](./docs/budget-tab.png)

CelebrAI turns one event idea (a wedding, birthday, college fest or community gathering) into a complete, editable plan: personalized ideas, a budget, a timeline, a vendor checklist, a guest tracker and ready-to-send invitations.

---

## 1. Problem

Planning an event means juggling budgets, deadlines, vendors and guests. AI planners help, but they run into three practical problems:

1. **Long single prompts.** Generating a full plan in one request can take long enough to hit serverless time limits.
2. **Unreliable math.** Language models often produce budget lines that do not add up to the total.
3. **Fragile demos.** API rate limits, expired keys or provider outages can break a live demo.

---

## 2. Solution

CelebrAI combines a **parallel sectioned architecture**, **code-owned mathematics** and an automatic **demo safety fallback**:

```
                       User Event Form Input
                                │
               ┌────────────────┴────────────────┐
               ▼                                 ▼
   [Serverless Route: /api/generate-plan]   [Demo Fallback Guard]
               │                                 │
     4 Concurrent Section Calls                  │
   ┌───────────┬───────────┬───────────┐         │
   ▼           ▼           ▼           ▼         │
Section A   Section B   Section C   Section D    │
 Concept     Budget      Timeline    Vendors     │
   │           │           │           │         │
   └─────┬─────┴─────┬─────┴─────┬─────┘         │
         ▼           ▼           ▼               ▼
   [Zod Schema Validation & Retry] ◄─────────────┘
                     │
                     ▼
   [Code-Owned Math Engine]
     • Budget line rescaling exact to the rupee
     • Date conversion and timeline compression
     • Guest counts and dietary aggregation
                     │
                     ▼
   [CelebrAI Event Workspace]
     • What-If budget slider (instant, client-side)
     • Context-aware AI assistant (apply-able changes)
     • Compressed read-only share links (lz-string, no backend)
     • WhatsApp invitations, JSON backup, print/PDF
```

---

## 3. How It Maps to the Problem Statement

| Problem statement | Where in CelebrAI |
| :--- | :--- |
| Budgets | **Budget & What-If** tab: editable lines, charts, over-budget warnings, cheaper alternatives |
| Timelines | **Timeline & Schedule** tab: dated checklist, priorities, event-day run sheet |
| Vendor checklists | **Vendors & Plan B** tab: questions to ask, price ranges, status tracking, weather backup |
| Personalized ideas | **Concept & Theme** tab and the **AI Assistant**, shaped by theme, diet, accessibility and culture |
| Weddings, birthdays, community events | Event types in the form, with the plan tailored to the type |

---

## 4. Feature Overview

| Feature | Description | Implementation |
| :--- | :--- | :--- |
| **4 parallel section calls** | Concept, Budget, Timeline & Schedule, Vendors & Contingency | Concurrent requests with progressive loading and per-section retry |
| **Code-owned math** | Budget lines always sum exactly to the total | Pure TypeScript engine (`src/lib/math.ts`) with Vitest tests |
| **Budget What-If slider** | Simulate a different budget without any AI call | Recalculates lines, percentages and warnings in the browser |
| **Timeline compression** | Converts offset days to real dates and flags overdue tasks | Adjusts milestones when the preparation window is short |
| **Guest & RSVP tracker** | Headcount, RSVP status and dietary counts | Per-head cost and dietary breakdown |
| **Context-aware AI assistant** | Ask for changes in plain language and apply them to the plan | Returns proposed changes; applying them re-runs the budget math |
| **Invitation generator** | Formal, Casual, Poetic and Funky tones | Copy to clipboard or send through WhatsApp |
| **Read-only share link** | Share a plan with no account or database | `lz-string` compression in the URL |
| **Local persistence** | Events are saved in the browser | `localStorage` with JSON export and import |
| **Print / PDF view** | Clean printable summary | Print styles (`@media print`) |

---

## 5. Tech Stack

| Layer | Technology |
| :--- | :--- |
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS |
| Charts and icons | Recharts, Lucide React |
| Validation | Zod |
| Sharing | lz-string |
| Backend | Vercel serverless functions (`/api/generate-plan`, `/api/chat`) |
| GenAI | Google Gemini by default; provider adapter also supports Anthropic and OpenAI (model: [FILL IN FROM providerAdapter.ts]) |
| Testing | Vitest |
| Hosting | Vercel |

---

## 6. How GenAI Is Used

### A. Parallel section calls
Instead of one large request, CelebrAI sends four smaller ones at the same time:

1. **Section A, Concept & Theme:** tagline, decor, food highlights, entertainment and activities.
2. **Section B, Budget:** category weights, cheaper alternatives and potential savings.
3. **Section C, Timeline & Run Sheet:** preparation tasks (`dueOffsetDays`) and the event-day schedule.
4. **Section D, Vendors & Plan B:** price ranges, questions to ask, coordinator tips and weather contingency.

### B. Schema validation
Each section response is validated against a Zod schema (`src/lib/schemas.ts`). If validation fails, the section is retried before falling back to a local sample.

### C. Code owns the math
Language models should not be trusted with financial figures. The `rescaleBudgetLines` function takes the AI's suggested weights and rescales whole-rupee allocations so they sum exactly to the user's total budget. Any rounding difference is assigned to the largest category.

---

## 7. Demo Safety

- **Automatic fallback.** If the AI provider is unavailable, rate-limited or returns invalid data, the app serves a locally generated sample plan and shows this banner:
  > `Sample plan, not live AI (Protected by Demo Safety Mode)`
- **One-click sample event.** The bundled example (**Aura '26 College Cultural Fest**, 250 guests) loads instantly from local data with no AI call.
- **Request limits.** The API routes limit input size and request volume. [REMOVE THIS LINE IF NOT IMPLEMENTED]

---

## 8. Project Structure

```
celebr-ai/
├── api/
│   ├── generate-plan.ts      # Serverless parallel planner route
│   └── chat.ts               # Context-aware assistant route
├── src/
│   ├── components/
│   │   ├── tabs/
│   │   │   ├── ConceptTab.tsx
│   │   │   ├── BudgetTab.tsx
│   │   │   ├── TimelineTab.tsx
│   │   │   ├── GuestTrackerTab.tsx
│   │   │   ├── VendorsTab.tsx
│   │   │   └── InvitationsTab.tsx
│   │   ├── ChatAssistantDrawer.tsx
│   │   ├── EventFormModal.tsx
│   │   ├── LandingHero.tsx
│   │   ├── Navbar.tsx
│   │   ├── PlanHeader.tsx
│   │   ├── PlanProgressModal.tsx
│   │   ├── SavedPlansDrawer.tsx
│   │   └── Toast.tsx
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── providerAdapter.ts   # Gemini / Claude / OpenAI adapter
│   │   │   ├── demoGenerator.ts     # Offline sample generator
│   │   │   └── parallelPlanner.ts   # Parallel runner and retries
│   │   ├── math.ts                  # Budget rescaling and date logic
│   │   ├── sampleData.ts            # "Aura '26" sample event
│   │   ├── schemas.ts               # Zod schemas
│   │   ├── sharing.ts               # Share links and WhatsApp helper
│   │   └── storage.ts               # localStorage manager
│   ├── tests/
│   │   └── math.test.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── vercel.json
```

---

## 9. Run Locally

**Prerequisites:** Node.js 18 or newer, and npm.

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional)
cp .env.example .env

# 3. Run tests
npm test

# 4. Start the front end
npm run dev
```

Open http://localhost:5173.

> `npm run dev` serves only the front end. The `/api` routes run on Vercel, so locally the app uses its sample-plan fallback. To run the API routes locally, use `npx vercel dev`.

---

## 10. Environment Variables

The app runs without any keys, in sample-plan mode. To enable live AI generation, set these in `.env` locally or in your Vercel project settings:

```env
# Provider: 'gemini' | 'anthropic' | 'openai'
LLM_PROVIDER=gemini

# Google Gemini API key (free tier available from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional alternatives
# ANTHROPIC_API_KEY=your_claude_api_key
# OPENAI_API_KEY=your_openai_api_key
```

Never commit a real key. `.env` is listed in `.gitignore`.

---

## 11. Deploy to Vercel

1. Push the code to a public GitHub repository.
2. Import the repository in the Vercel dashboard.
3. Add `GEMINI_API_KEY` (and `LLM_PROVIDER`) under **Settings, Environment Variables**.
4. Deploy. After changing a variable, redeploy so it takes effect.

Or with the CLI:

```bash
npm i -g vercel
vercel --prod
```

---

## 12. Limitations

1. **No database or login.** Plans are stored in the browser (`localStorage`). To move a plan between devices, use the share link or JSON export and import.
2. **Sample plans without an API key.** Without a working key, or if the provider fails, plans come from the built-in sample generator, not live AI. The banner always says so.
3. **Price figures are estimates.** Budget amounts and vendor price ranges are rough guidance, not quotes, and the app does not list real vendors.
4. **Long share links.** Very large plans produce long URLs, even after compression.
