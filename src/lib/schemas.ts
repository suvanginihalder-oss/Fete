import { z } from "zod";

export const eventFormSchema = z.object({
  eventType: z.enum(
    ["wedding", "birthday", "anniversary", "college_fest", "community"],
    {
      errorMap: () => ({ message: "Please select a valid event type" }),
    },
  ),
  name: z
    .string()
    .trim()
    .min(3, "Event name must be at least 3 characters")
    .max(80, "Event name must be 80 characters or less"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .refine(
      (val) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDate = new Date(val);
        return !isNaN(eventDate.getTime()) && eventDate >= today;
      },
      { message: "Event date must be in the future (or today)" },
    ),
  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .max(50, "City name is too long"),
  guests: z
    .number()
    .int()
    .min(1, "At least 1 guest required")
    .max(200000, "Guest count exceeds maximum"),
  budget: z
    .number()
    .int()
    .min(500, "Budget must be at least 500")
    .max(1000000000, "Budget exceeds allowed limit"),
  currency: z.string().default("₹"),
  theme: z
    .string()
    .trim()
    .max(120, "Theme must be 120 characters or less")
    .default("Festive Elegance"),
  dietary: z.array(z.string()).default([]),
  accessibility: z.array(z.string()).default([]),
  culturalPreferences: z
    .string()
    .trim()
    .max(250, "Cultural preferences text too long")
    .default(""),
  specialRequests: z
    .string()
    .trim()
    .max(500, "Special requests text too long")
    .default(""),
});

// ─── Concept ────────────────────────────────────────────────────────────────

export const decorIdeaSchema = z
  .object({
    title: z.string().catch("Decoration Idea"),
    description: z.string().catch(""),
    estCostSharePercent: z.coerce.number().min(0).max(100).catch(10),
    items: z.array(z.string()).catch([]),
  })
  .passthrough();

export const culinaryConceptSchema = z
  .object({
    title: z.string().catch("Culinary Experience"),
    description: z.string().catch(""),
    highlights: z.array(z.string()).catch([]),
    dietaryAccommodations: z
      .string()
      .catch("Standard dietary options available"),
  })
  .passthrough();

export const entertainmentConceptSchema = z
  .object({
    title: z.string().catch("Entertainment"),
    description: z.string().catch(""),
    scheduleSuggestion: z.string().catch("TBD"),
    highlights: z.array(z.string()).catch([]),
  })
  .passthrough();

export const activityIdeaSchema = z
  .object({
    title: z.string().catch("Activity"),
    description: z.string().catch(""),
    targetAudience: z.string().catch("All guests"),
  })
  .passthrough();

export const conceptDataSchema = z
  .object({
    tagline: z.string().catch("An unforgettable celebration"),
    decor: z.array(decorIdeaSchema).catch([
      {
        title: "Elegant Decor",
        description: "Beautiful themed decorations",
        estCostSharePercent: 20,
        items: ["Flowers", "Lights", "Drapes"],
      },
    ]),
    food: culinaryConceptSchema.catch({
      title: "Culinary Experience",
      description: "Delightful food and beverages",
      highlights: ["Multi-cuisine spread"],
      dietaryAccommodations: "All dietary needs catered",
    }),
    entertainment: entertainmentConceptSchema.catch({
      title: "Entertainment",
      description: "Fun and engaging activities",
      scheduleSuggestion: "Evening performances",
      highlights: ["Music", "Dance"],
    }),
    activities: z.array(activityIdeaSchema).catch([
      {
        title: "Interactive Games",
        description: "Fun for everyone",
        targetAudience: "All guests",
      },
    ]),
  })
  .passthrough();

// ─── Budget (strict on math, lenient on shape) ───────────────────────────────

export const rawBudgetLineSchema = z
  .object({
    category: z.string().catch("Miscellaneous"),
    item: z.string().catch("General Expense"),
    // allocatedAmount MUST be a number — code owns the math; coerce string numbers from AI
    allocatedAmount: z.coerce.number().min(0).catch(0),
    actualAmount: z.coerce.number().optional().default(0),
    percentage: z.coerce.number().min(0).max(100).optional().catch(0),
    isCheaperAlternativeAvailable: z.boolean().catch(false),
    cheaperAlternativeNote: z.string().catch(""),
    potentialSavings: z.coerce.number().catch(0),
  })
  .passthrough();

export const budgetSectionSchema = z.object({
  // Need at least 1 line; 3 is ideal but 1 is safe — code rescales regardless
  lines: z
    .array(rawBudgetLineSchema)
    .min(1)
    .catch([
      {
        category: "General",
        item: "Event Expenses",
        allocatedAmount: 1,
        actualAmount: 0,
        percentage: 100,
        isCheaperAlternativeAvailable: false,
        cheaperAlternativeNote: "",
        potentialSavings: 0,
      },
    ]),
});

// ─── Timeline ────────────────────────────────────────────────────────────────

export const rawTimelineTaskSchema = z
  .object({
    title: z.string().catch("Task"),
    category: z.string().catch("General"),
    // Negative = days BEFORE event (e.g. -30), 0 = event day, positive = after
    // AI often sends negative offsets; no .min() restriction
    dueOffsetDays: z.coerce.number().int().catch(-7),
    priority: z.enum(["high", "medium", "low"]).catch("medium"),
    notes: z.string().catch(""),
  })
  .passthrough();

export const dayScheduleItemSchema = z
  .object({
    time: z.string().catch("09:00 AM"),
    activity: z.string().catch("Event Activity"),
    owner: z.string().catch("Host"),
    notes: z.string().catch(""),
  })
  .passthrough();

export const timelineSectionSchema = z
  .object({
    tasks: z.array(rawTimelineTaskSchema).catch([]),
    daySchedule: z.array(dayScheduleItemSchema).catch([]),
  })
  .passthrough();

// ─── Vendors ─────────────────────────────────────────────────────────────────

export const rawVendorItemSchema = z
  .object({
    serviceType: z.string().catch("Vendor"),
    estCostRange: z.string().catch("Price on request"),
    questionsToAsk: z
      .array(z.string())
      .catch([
        "What is your availability?",
        "What is included in the package?",
      ]),
  })
  .passthrough();

export const weatherPlanBSchema = z
  .object({
    riskAssessment: z.string().catch("Standard seasonal weather risk."),
    contingencySteps: z
      .array(z.string())
      .catch(["Monitor weather 48h before event", "Prepare indoor backup."]),
    backupVenuesOrGear: z.array(z.string()).catch(["Indoor banquet hall"]),
  })
  .passthrough();

export const vendorSectionSchema = z
  .object({
    vendors: z.array(rawVendorItemSchema).catch([]),
    expertTips: z.array(z.string()).catch([]),
    weatherPlanB: weatherPlanBSchema.catch({
      riskAssessment: "Low risk.",
      contingencySteps: ["Monitor weather 48h before event"],
      backupVenuesOrGear: ["Indoor hall on standby"],
    }),
  })
  .passthrough();
