import { describe, it, expect } from "vitest";
import {
  generateDemoConcept,
  generateDemoBudgetLines,
  generateDemoTimeline,
  generateDemoVendors,
} from "../lib/ai/demoGenerator";
import { rescaleBudgetLines } from "../lib/math";
import {
  conceptDataSchema,
  budgetSectionSchema,
  timelineSectionSchema,
  vendorSectionSchema,
} from "../lib/schemas";
import type { EventFormInput } from "../types";

function makeInput(overrides: Record<string, unknown> = {}): EventFormInput {
  return {
    eventType: "college_fest",
    name: "Aura '26",
    date: "2026-11-30",
    city: "Bengaluru",
    guests: 250,
    budget: 100000,
    currency: "₹",
    theme: "Retro Neon Waves",
    dietary: ["Pure Veg", "Jain Option"],
    accessibility: [],
    culturalPreferences: "Battle of the bands",
    specialRequests: "",
    ...overrides,
  } as unknown as EventFormInput;
}

// ─── Concept ─────────────────────────────────────────────────────────────────

describe("generateDemoConcept", () => {
  it("builds the tagline from the event name, vibe and city", () => {
    const concept = generateDemoConcept(makeInput());
    expect(concept.tagline).toContain("Aura '26");
    expect(concept.tagline).toContain("High-Octane Youth Fusion & Indie Power");
    expect(concept.tagline).toContain("Bengaluru");
  });

  it("changes the vibe and entertainment with the event type", () => {
    const fest = generateDemoConcept(makeInput({ eventType: "college_fest" }));
    const wedding = generateDemoConcept(makeInput({ eventType: "wedding" }));
    const birthday = generateDemoConcept(makeInput({ eventType: "birthday" }));
    expect(fest.entertainment.title).toBe(
      "Battle of the Bands, EDM Sunset & Street Plays",
    );
    expect(wedding.decor[0]?.title).toBe("Floral Mandap & Fairy Canopy");
    expect(wedding.tagline).not.toBe(birthday.tagline);
  });

  it("falls back to the community concept for an unknown event type", () => {
    const concept = generateDemoConcept(makeInput({ eventType: "mystery" }));
    expect(concept.tagline).toContain("Inclusive Warmth & Cultural Heritage");
  });

  it("includes dietary choices, or a default when none are selected", () => {
    const withDiet = generateDemoConcept(makeInput());
    expect(withDiet.food.description).toContain("Pure Veg, Jain Option");
    expect(withDiet.food.dietaryAccommodations).toContain("Pure Veg, Jain Option");

    const noDiet = generateDemoConcept(makeInput({ dietary: [] }));
    expect(noDiet.food.description).toContain("Standard accommodating");
  });

  it("uses the guest count, theme and cultural preferences", () => {
    const concept = generateDemoConcept(makeInput());
    expect(concept.decor[0]?.description).toContain("Retro Neon Waves");
    expect(concept.decor[0]?.items[0]).toContain("250 guests");
    expect(concept.entertainment.description).toContain("Battle of the bands");
  });

  it("uses fallbacks when theme and cultural preferences are empty", () => {
    const concept = generateDemoConcept(
      makeInput({ theme: "", culturalPreferences: "" }),
    );
    expect(concept.decor[0]?.description).toContain("signature elegance");
    expect(concept.entertainment.description).toContain(
      "Engaging modern music & celebratory performances",
    );
  });

  it("returns the expected number of ideas and passes schema validation", () => {
    const concept = generateDemoConcept(makeInput());
    expect(concept.decor.length).toBe(2);
    expect(concept.activities.length).toBe(3);
    const parsed = conceptDataSchema.parse(concept);
    expect(parsed.tagline).toBe(concept.tagline);
    expect(parsed.decor.length).toBe(2);
  });
});

// ─── Budget ──────────────────────────────────────────────────────────────────

describe("generateDemoBudgetLines", () => {
  it("returns six categories with no spending yet", () => {
    const lines = generateDemoBudgetLines(makeInput());
    expect(lines.length).toBe(6);
    expect(lines.every((l) => l.actualAmount === 0)).toBe(true);
    expect(lines.some((l) => l.category === "Emergency Buffer & Contingency")).toBe(
      true,
    );
  });

  it("gives weddings a larger venue share than other events", () => {
    const other = generateDemoBudgetLines(makeInput({ eventType: "birthday" }));
    const wedding = generateDemoBudgetLines(makeInput({ eventType: "wedding" }));
    expect(other[0]?.allocatedAmount).toBe(25000);
    expect(wedding[0]?.allocatedAmount).toBe(30000);
    expect(other[1]?.allocatedAmount).toBe(35000);
  });

  it("shows a per-plate price and never produces NaN for zero guests", () => {
    const lines = generateDemoBudgetLines(makeInput());
    expect(lines[1]?.item).toContain("₹140/plate");

    const zeroGuests = generateDemoBudgetLines(makeInput({ guests: 0 }));
    expect(zeroGuests[1]?.item).not.toContain("NaN");
    expect(zeroGuests[1]?.item).not.toContain("Infinity");
  });

  it("marks photography and the buffer as having no cheaper alternative", () => {
    const lines = generateDemoBudgetLines(makeInput());
    const photo = lines.find((l) => l.category === "Photography & Videography");
    expect(photo?.isCheaperAlternativeAvailable).toBe(false);
    expect(photo?.potentialSavings).toBe(0);
  });

  it("passes schema validation and rescales exactly to the budget", () => {
    const input = makeInput({ budget: 1500000 });
    const lines = generateDemoBudgetLines(input);

    const parsed = budgetSectionSchema.parse({ lines });
    expect(parsed.lines.length).toBe(6);

    const summary = rescaleBudgetLines(lines, input.budget);
    expect(summary.totalAllocated).toBe(1500000);
    expect(summary.lines.reduce((sum, l) => sum + l.allocatedAmount, 0)).toBe(
      1500000,
    );
  });
});

// ─── Timeline ────────────────────────────────────────────────────────────────

describe("generateDemoTimeline", () => {
  it("returns six tasks counting down to the event", () => {
    const { tasks } = generateDemoTimeline(makeInput());
    expect(tasks.length).toBe(6);
    expect(tasks.map((t) => t.dueOffsetDays)).toEqual([30, 21, 15, 10, 5, 1]);
    expect(
      tasks.every((t) => ["high", "medium", "low"].includes(t.priority)),
    ).toBe(true);
  });

  it("personalizes task notes with guests and dietary needs", () => {
    const { tasks } = generateDemoTimeline(makeInput());
    expect(tasks[0]?.notes).toContain("250 guests");
    expect(tasks[1]?.notes).toContain("Pure Veg, Jain Option");

    const noDiet = generateDemoTimeline(makeInput({ dietary: [] }));
    expect(noDiet.tasks[1]?.notes).toContain("standard");
  });

  it("returns an event-day schedule with unique ids", () => {
    const { daySchedule } = generateDemoTimeline(makeInput());
    expect(daySchedule.length).toBe(6);
    const ids = daySchedule.map((s) => s.id);
    expect(new Set(ids).size).toBe(6);
    expect(daySchedule[0]?.id).toBe("sched-d-1");
  });

  it("passes schema validation without falling back to defaults", () => {
    const result = generateDemoTimeline(makeInput());
    const parsed = timelineSectionSchema.parse(result);
    expect(parsed.tasks.length).toBe(6);
    expect(parsed.tasks[0]?.title).toBe("Confirm & Reserve Venue Contract");
    expect(parsed.daySchedule.length).toBe(6);
  });
});

// ─── Vendors ─────────────────────────────────────────────────────────────────

describe("generateDemoVendors", () => {
  it("returns four vendor categories with price ranges", () => {
    const { vendors } = generateDemoVendors(makeInput());
    expect(vendors.length).toBe(4);
    for (const vendor of vendors) {
      expect(vendor.estCostRange.startsWith("₹")).toBe(true);
      expect(vendor.estCostRange).toContain(" - ");
      expect(vendor.questionsToAsk.length).toBe(3);
    }
  });

  it("uses the selected currency symbol", () => {
    const { vendors } = generateDemoVendors(makeInput({ currency: "$" }));
    expect(vendors[0]?.estCostRange.startsWith("$")).toBe(true);
  });

  it("mentions dietary needs in the catering questions", () => {
    const { vendors } = generateDemoVendors(makeInput());
    expect(vendors[1]?.questionsToAsk[0]).toContain("Pure Veg, Jain Option");

    const noDiet = generateDemoVendors(makeInput({ dietary: [] }));
    expect(noDiet.vendors[1]?.questionsToAsk[0]).toContain("special");
  });

  it("returns expert tips and a weather plan for the event city", () => {
    const { expertTips, weatherPlanB } = generateDemoVendors(makeInput());
    expect(expertTips.length).toBe(4);
    expect(expertTips[0]).toContain("Bengaluru");
    expect(weatherPlanB.riskAssessment).toContain("Bengaluru");
    expect(weatherPlanB.contingencySteps.length).toBe(3);
    expect(weatherPlanB.backupVenuesOrGear.length).toBe(3);
  });

  it("passes schema validation without falling back to defaults", () => {
    const result = generateDemoVendors(makeInput());
    const parsed = vendorSectionSchema.parse(result);
    expect(parsed.vendors.length).toBe(4);
    expect(parsed.vendors[0]?.serviceType).toBe("Venue & Banquet Hall");
    expect(parsed.weatherPlanB.contingencySteps.length).toBe(3);
  });
});
