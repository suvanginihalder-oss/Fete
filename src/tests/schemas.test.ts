import { describe, it, expect } from "vitest";
import {
  eventFormSchema,
  decorIdeaSchema,
  conceptDataSchema,
  rawBudgetLineSchema,
  budgetSectionSchema,
  rawTimelineTaskSchema,
  dayScheduleItemSchema,
  timelineSectionSchema,
  rawVendorItemSchema,
  vendorSectionSchema,
} from "../lib/schemas";

function futureDate(daysAhead: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

const validForm = () => ({
  eventType: "college_fest",
  name: "Aura '26 Cultural Fest",
  date: futureDate(30),
  city: "Bengaluru",
  guests: 250,
  budget: 1500000,
});

function messageFor(
  result: ReturnType<typeof eventFormSchema.safeParse>,
  field: string,
): string | undefined {
  if (result.success) return undefined;
  return result.error.issues.find((i) => i.path[0] === field)?.message;
}

// ─── eventFormSchema ─────────────────────────────────────────────────────────

describe("eventFormSchema", () => {
  it("accepts a valid event and fills in defaults", () => {
    const result = eventFormSchema.safeParse(validForm());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("₹");
      expect(result.data.theme).toBe("Festive Elegance");
      expect(result.data.dietary).toEqual([]);
      expect(result.data.accessibility).toEqual([]);
      expect(result.data.culturalPreferences).toBe("");
      expect(result.data.specialRequests).toBe("");
    }
  });

  it("trims whitespace from the event name", () => {
    const result = eventFormSchema.safeParse({
      ...validForm(),
      name: "  Aura Fest  ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.name).toBe("Aura Fest");
  });

  it("rejects an unknown event type", () => {
    const result = eventFormSchema.safeParse({
      ...validForm(),
      eventType: "funeral",
    });
    expect(result.success).toBe(false);
    expect(messageFor(result, "eventType")).toBe(
      "Please select a valid event type",
    );
  });

  it("rejects names that are too short or too long", () => {
    const short = eventFormSchema.safeParse({ ...validForm(), name: "ab" });
    expect(messageFor(short, "name")).toBe(
      "Event name must be at least 3 characters",
    );

    const long = eventFormSchema.safeParse({
      ...validForm(),
      name: "x".repeat(81),
    });
    expect(messageFor(long, "name")).toBe(
      "Event name must be 80 characters or less",
    );
  });

  it("rejects past dates and badly formatted dates", () => {
    const past = eventFormSchema.safeParse({
      ...validForm(),
      date: "2020-01-01",
    });
    expect(messageFor(past, "date")).toBe(
      "Event date must be in the future (or today)",
    );

    const badFormat = eventFormSchema.safeParse({
      ...validForm(),
      date: "01/12/2030",
    });
    expect(messageFor(badFormat, "date")).toBe(
      "Date must be in YYYY-MM-DD format",
    );
  });

  it("validates the city length", () => {
    const result = eventFormSchema.safeParse({ ...validForm(), city: "A" });
    expect(messageFor(result, "city")).toBe("City is required");
  });

  it("rejects invalid guest counts", () => {
    expect(
      eventFormSchema.safeParse({ ...validForm(), guests: 0 }).success,
    ).toBe(false);
    expect(
      eventFormSchema.safeParse({ ...validForm(), guests: 1.5 }).success,
    ).toBe(false);
    expect(
      eventFormSchema.safeParse({ ...validForm(), guests: 200001 }).success,
    ).toBe(false);
  });

  it("rejects budgets that are too small, too large, or not numbers", () => {
    const small = eventFormSchema.safeParse({ ...validForm(), budget: 499 });
    expect(messageFor(small, "budget")).toBe("Budget must be at least 500");

    expect(
      eventFormSchema.safeParse({ ...validForm(), budget: 2000000000 }).success,
    ).toBe(false);

    expect(
      eventFormSchema.safeParse({ ...validForm(), budget: "1000" }).success,
    ).toBe(false);
  });

  it("limits the length of free-text fields", () => {
    expect(
      eventFormSchema.safeParse({ ...validForm(), theme: "t".repeat(121) })
        .success,
    ).toBe(false);
    expect(
      eventFormSchema.safeParse({
        ...validForm(),
        culturalPreferences: "c".repeat(251),
      }).success,
    ).toBe(false);
    expect(
      eventFormSchema.safeParse({
        ...validForm(),
        specialRequests: "s".repeat(501),
      }).success,
    ).toBe(false);
  });
});

// ─── Concept ─────────────────────────────────────────────────────────────────

describe("concept schemas", () => {
  it("fills every field with a fallback when the AI returns nothing", () => {
    const parsed = conceptDataSchema.parse({});
    expect(parsed.tagline).toBe("An unforgettable celebration");
    expect(parsed.decor.length).toBe(1);
    expect(parsed.food.title).toBe("Culinary Experience");
    expect(parsed.entertainment.title).toBe("Entertainment");
    expect(parsed.activities.length).toBe(1);
  });

  it("replaces a malformed section with its fallback", () => {
    const parsed = conceptDataSchema.parse({ decor: "not an array" });
    expect(parsed.decor[0]?.title).toBe("Elegant Decor");
  });

  it("keeps valid content and unknown extra keys", () => {
    const parsed = conceptDataSchema.parse({
      tagline: "Neon Nights",
      mood: "electric",
    });
    expect(parsed.tagline).toBe("Neon Nights");
    expect(parsed).toMatchObject({ mood: "electric" });
  });

  it("coerces numeric strings and falls back for out-of-range values", () => {
    expect(
      decorIdeaSchema.parse({ estCostSharePercent: "25" }).estCostSharePercent,
    ).toBe(25);
    expect(
      decorIdeaSchema.parse({ estCostSharePercent: 500 }).estCostSharePercent,
    ).toBe(10);
    expect(decorIdeaSchema.parse({}).title).toBe("Decoration Idea");
  });
});

// ─── Budget ──────────────────────────────────────────────────────────────────

describe("budget schemas", () => {
  it("coerces numeric strings for allocated amounts", () => {
    expect(
      rawBudgetLineSchema.parse({ allocatedAmount: "1500" }).allocatedAmount,
    ).toBe(1500);
  });

  it("falls back to zero for invalid or negative amounts", () => {
    expect(
      rawBudgetLineSchema.parse({ allocatedAmount: "abc" }).allocatedAmount,
    ).toBe(0);
    expect(
      rawBudgetLineSchema.parse({ allocatedAmount: -5 }).allocatedAmount,
    ).toBe(0);
    expect(rawBudgetLineSchema.parse({}).allocatedAmount).toBe(0);
  });

  it("applies defaults for missing text and actual amount", () => {
    const line = rawBudgetLineSchema.parse({});
    expect(line.category).toBe("Miscellaneous");
    expect(line.item).toBe("General Expense");
    expect(line.actualAmount).toBe(0);
    expect(line.isCheaperAlternativeAvailable).toBe(false);
  });

  it("keeps a valid list of budget lines", () => {
    const parsed = budgetSectionSchema.parse({
      lines: [
        { category: "Venue", allocatedAmount: 40 },
        { category: "Food", allocatedAmount: 60 },
      ],
    });
    expect(parsed.lines.length).toBe(2);
    expect(parsed.lines[1]?.category).toBe("Food");
  });

  it("falls back to a single line when the list is empty or missing", () => {
    expect(budgetSectionSchema.parse({ lines: [] }).lines[0]?.category).toBe(
      "General",
    );
    expect(budgetSectionSchema.parse({}).lines.length).toBe(1);
  });
});

// ─── Timeline ────────────────────────────────────────────────────────────────

describe("timeline schemas", () => {
  it("coerces offsets and rejects non-integers", () => {
    expect(
      rawTimelineTaskSchema.parse({ dueOffsetDays: "-30" }).dueOffsetDays,
    ).toBe(-30);
    expect(
      rawTimelineTaskSchema.parse({ dueOffsetDays: 5.5 }).dueOffsetDays,
    ).toBe(-7);
  });

  it("defaults an unknown priority to medium", () => {
    expect(rawTimelineTaskSchema.parse({ priority: "urgent" }).priority).toBe(
      "medium",
    );
    expect(rawTimelineTaskSchema.parse({ priority: "high" }).priority).toBe(
      "high",
    );
  });

  it("applies defaults to an empty task and an empty schedule item", () => {
    const task = rawTimelineTaskSchema.parse({});
    expect(task.title).toBe("Task");
    expect(task.category).toBe("General");

    const item = dayScheduleItemSchema.parse({});
    expect(item.time).toBe("09:00 AM");
    expect(item.owner).toBe("Host");
  });

  it("returns empty lists when the AI sends nothing", () => {
    const parsed = timelineSectionSchema.parse({});
    expect(parsed.tasks).toEqual([]);
    expect(parsed.daySchedule).toEqual([]);
  });
});

// ─── Vendors ─────────────────────────────────────────────────────────────────

describe("vendor schemas", () => {
  it("falls back to default questions when they are invalid", () => {
    const vendor = rawVendorItemSchema.parse({ questionsToAsk: "ask nicely" });
    expect(vendor.questionsToAsk.length).toBe(2);
    expect(vendor.serviceType).toBe("Vendor");
    expect(vendor.estCostRange).toBe("Price on request");
  });

  it("uses the low-risk fallback when weatherPlanB is missing", () => {
    const parsed = vendorSectionSchema.parse({});
    expect(parsed.vendors).toEqual([]);
    expect(parsed.expertTips).toEqual([]);
    expect(parsed.weatherPlanB.riskAssessment).toBe("Low risk.");
  });

  it("fills defaults inside a partial weatherPlanB", () => {
    const parsed = vendorSectionSchema.parse({ weatherPlanB: {} });
    expect(parsed.weatherPlanB.riskAssessment).toBe(
      "Standard seasonal weather risk.",
    );
    expect(parsed.weatherPlanB.backupVenuesOrGear).toEqual([
      "Indoor banquet hall",
    ]);
  });

  it("keeps valid vendors", () => {
    const parsed = vendorSectionSchema.parse({
      vendors: [
        {
          serviceType: "Catering",
          estCostRange: "₹10,000 - ₹20,000",
          questionsToAsk: ["Do you handle Jain meals?"],
        },
      ],
    });
    expect(parsed.vendors[0]?.serviceType).toBe("Catering");
    expect(parsed.vendors[0]?.questionsToAsk).toEqual([
      "Do you handle Jain meals?",
    ]);
  });
});
