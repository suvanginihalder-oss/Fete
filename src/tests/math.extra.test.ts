import { describe, it, expect } from "vitest";
import {
  rescaleBudgetLines,
  computeTimelineDates,
  calculateProgress,
  calculateGuestMetrics,
} from "../lib/math";
import type { BudgetLine, GuestItem, RawTimelineTask } from "../types";

const asTasks = (items: unknown[]) => items as unknown as RawTimelineTask[];
const asGuests = (items: unknown[]) => items as unknown as GuestItem[];

// ─── rescaleBudgetLines ──────────────────────────────────────────────────────

describe("rescaleBudgetLines", () => {
  it("returns an empty summary with a warning when there are no lines", () => {
    const result = rescaleBudgetLines([], 50000);
    expect(result.totalBudget).toBe(50000);
    expect(result.lines).toEqual([]);
    expect(result.remainingBudget).toBe(50000);
    expect(result.isOverBudget).toBe(false);
    expect(result.warnings).toContain("No budget categories defined.");
  });

  it("always sums allocations exactly to the total budget", () => {
    const weightSets = [
      [1, 1, 1],
      [10, 20, 30, 40],
      [33, 33, 34],
      [5, 0, 0, 95],
      [1, 2, 3, 4, 5, 6, 7],
    ];
    const totals = [100, 999, 50000, 1500000];

    for (const weights of weightSets) {
      for (const total of totals) {
        const lines: Array<Partial<BudgetLine>> = weights.map((w, i) => ({
          category: `Cat ${i}`,
          allocatedAmount: w,
        }));
        const result = rescaleBudgetLines(lines, total);
        const sum = result.lines.reduce((acc, l) => acc + l.allocatedAmount, 0);
        expect(sum).toBe(total);
        expect(result.totalAllocated).toBe(total);
      }
    }
  });

  it("puts the rounding remainder on the largest category", () => {
    const lines: Array<Partial<BudgetLine>> = [
      { category: "A", allocatedAmount: 3 },
      { category: "B", allocatedAmount: 3 },
      { category: "C", allocatedAmount: 3 },
    ];
    const result = rescaleBudgetLines(lines, 100);
    expect(result.lines.map((l) => l.allocatedAmount)).toEqual([34, 33, 33]);
  });

  it("splits evenly when every raw allocation is zero", () => {
    const lines: Array<Partial<BudgetLine>> = [
      { category: "A", allocatedAmount: 0 },
      { category: "B", allocatedAmount: 0 },
      { category: "C", allocatedAmount: 0 },
    ];
    const result = rescaleBudgetLines(lines, 10);
    expect(result.lines.map((l) => l.allocatedAmount)).toEqual([4, 3, 3]);
  });

  it("rounds a fractional total and clamps a negative total to zero", () => {
    const lines: Array<Partial<BudgetLine>> = [
      { category: "A", allocatedAmount: 1 },
    ];
    expect(rescaleBudgetLines(lines, 99.6).totalBudget).toBe(100);
    const negative = rescaleBudgetLines(lines, -500);
    expect(negative.totalBudget).toBe(0);
    expect(negative.lines[0]?.allocatedAmount).toBe(0);
    expect(negative.lines[0]?.percentage).toBe(0);
  });

  it("calculates percentages and warns about a concentrated category", () => {
    const lines: Array<Partial<BudgetLine>> = [
      { category: "Venue", allocatedAmount: 50 },
      { category: "Food", allocatedAmount: 50 },
    ];
    const result = rescaleBudgetLines(lines, 1000);
    expect(result.lines.map((l) => l.percentage)).toEqual([50, 50]);
    expect(result.warnings).toContain(
      '"Venue" represents 50% of the entire budget.',
    );
  });

  it("flags over-budget spending and caps the remaining budget at zero", () => {
    const lines: Array<Partial<BudgetLine>> = [
      { category: "Venue", allocatedAmount: 100, actualAmount: 600 },
    ];
    const result = rescaleBudgetLines(lines, 500);
    expect(result.isOverBudget).toBe(true);
    expect(result.overBudgetAmount).toBe(100);
    expect(result.remainingBudget).toBe(0);
    expect(
      result.warnings.some((w) => w.includes("exceeds budget by 100")),
    ).toBe(true);
  });

  it("reports the remaining budget when spending is under the total", () => {
    const lines: Array<Partial<BudgetLine>> = [
      { category: "Venue", allocatedAmount: 100, actualAmount: 100 },
    ];
    const result = rescaleBudgetLines(lines, 1000);
    expect(result.isOverBudget).toBe(false);
    expect(result.totalActual).toBe(100);
    expect(result.remainingBudget).toBe(900);
  });

  it("recommends a contingency fund only when none exists", () => {
    const without = rescaleBudgetLines(
      [
        { category: "Venue", allocatedAmount: 1 },
        { category: "Food", allocatedAmount: 1 },
        { category: "Decor", allocatedAmount: 1 },
      ],
      1000,
    );
    expect(without.warnings.some((w) => w.includes("emergency buffer"))).toBe(
      true,
    );

    const withBuffer = rescaleBudgetLines(
      [
        { category: "Venue", allocatedAmount: 1 },
        { category: "Food", allocatedAmount: 1 },
        { category: "Emergency Buffer & Contingency", allocatedAmount: 1 },
      ],
      1000,
    );
    expect(
      withBuffer.warnings.some((w) => w.includes("emergency buffer")),
    ).toBe(false);
  });

  it("fills in defaults for missing fields and keeps provided ones", () => {
    const result = rescaleBudgetLines(
      [
        { allocatedAmount: 1 },
        {
          id: "keep-me",
          category: "Food",
          potentialSavings: 0,
          allocatedAmount: 1,
        },
      ],
      1000,
    );
    const first = result.lines[0];
    const second = result.lines[1];
    expect(first?.category).toBe("General");
    expect(first?.item).toBe("Item 1");
    expect(first?.cheaperAlternativeNote).toBe(
      "Bulk vendor discounts or DIY options available.",
    );
    expect(first?.potentialSavings).toBe(75); // 15% of 500
    expect(second?.id).toBe("keep-me");
    expect(second?.potentialSavings).toBe(0);
  });
});

// ─── computeTimelineDates ────────────────────────────────────────────────────

describe("computeTimelineDates", () => {
  // Local noon on 1 Nov 2026 keeps the test independent of time zone.
  const reference = new Date(2026, 10, 1, 12, 0, 0);

  it("converts offsets to calendar dates counted back from the event", () => {
    const result = computeTimelineDates(
      asTasks([{ title: "Book venue", dueOffsetDays: 7 }]),
      "2026-11-30",
      reference,
    );
    expect(result[0]?.targetDate).toBe("2026-11-23");
    expect(result[0]?.isOverdue).toBe(false);
    expect(result[0]?.isCompressed).toBe(false);
    expect(result[0]?.completed).toBe(false);
    expect(result[0]?.id).toMatch(/^task-/);
  });

  it("places an offset of zero on the event day", () => {
    const result = computeTimelineDates(
      asTasks([{ title: "Event day", dueOffsetDays: 0 }]),
      "2026-11-30",
      reference,
    );
    expect(result[0]?.targetDate).toBe("2026-11-30");
  });

  it("sorts tasks from earliest to latest", () => {
    const result = computeTimelineDates(
      asTasks([
        { title: "One day", dueOffsetDays: 1 },
        { title: "Two weeks", dueOffsetDays: 14 },
        { title: "One week", dueOffsetDays: 7 },
      ]),
      "2026-11-30",
      reference,
    );
    expect(result.map((t) => t.dueOffsetDays)).toEqual([14, 7, 1]);
  });

  it("compresses tasks that do not fit before a close event", () => {
    const result = computeTimelineDates(
      asTasks([{ title: "Early task", dueOffsetDays: 30 }]),
      "2026-11-05",
      reference,
    );
    expect(result[0]?.isCompressed).toBe(true);
    expect(result[0]?.dueOffsetDays).toBe(2);
    expect(result[0]?.targetDate).toBe("2026-11-03");
    expect(result[0]?.isOverdue).toBe(false);
  });

  it("marks tasks overdue when the event date has already passed", () => {
    const result = computeTimelineDates(
      asTasks([{ title: "Late task", dueOffsetDays: 5 }]),
      "2026-10-20",
      reference,
    );
    expect(result[0]?.isOverdue).toBe(true);
    expect(result[0]?.targetDate).toBe("2026-10-20");
  });

  it("returns an empty list for no tasks", () => {
    expect(computeTimelineDates([], "2026-11-30", reference)).toEqual([]);
  });
});

// ─── calculateProgress ───────────────────────────────────────────────────────

describe("calculateProgress", () => {
  it("returns zeros for an empty list", () => {
    expect(calculateProgress([])).toEqual({
      total: 0,
      completed: 0,
      percentage: 0,
    });
  });

  it("rounds the completion percentage", () => {
    const result = calculateProgress([
      { completed: true },
      { completed: false },
      { completed: false },
    ]);
    expect(result).toEqual({ total: 3, completed: 1, percentage: 33 });
  });

  it("reports 100% when every task is complete", () => {
    const result = calculateProgress([
      { completed: true },
      { completed: true },
    ]);
    expect(result.percentage).toBe(100);
  });
});

// ─── calculateGuestMetrics ───────────────────────────────────────────────────

describe("calculateGuestMetrics", () => {
  it("counts headcount by RSVP status, including plus-ones", () => {
    const guests = asGuests([
      { status: "confirmed", plusOnes: 1 },
      { status: "confirmed", plusOnes: 0 },
      { status: "pending", plusOnes: 2 },
      { status: "declined" },
    ]);
    const result = calculateGuestMetrics(guests, 30000, 100);
    expect(result.confirmed).toBe(3);
    expect(result.pending).toBe(3);
    expect(result.declined).toBe(1);
    expect(result.totalHeadcount).toBe(6);
  });

  it("aggregates trimmed dietary notes and ignores blank ones", () => {
    const guests = asGuests([
      { status: "confirmed", plusOnes: 1, dietaryNote: "Vegan" },
      { status: "pending", dietaryNote: "Vegan" },
      { status: "confirmed", dietaryNote: "  Jain  " },
      { status: "confirmed", dietaryNote: "   " },
    ]);
    const result = calculateGuestMetrics(guests, 10000, 50);
    expect(result.dietaryCounts).toEqual({ Vegan: 3, Jain: 1 });
  });

  // These per-head tests expect the fix: divide by the larger of confirmed
  // headcount and expected guests (see the note that came with this file).
  it("divides the budget by expected guests when few RSVPs are in", () => {
    const guests = asGuests([
      { status: "confirmed", plusOnes: 1 },
      { status: "confirmed", plusOnes: 0 },
    ]);
    const result = calculateGuestMetrics(guests, 1500000, 250);
    expect(result.effectiveGuests).toBe(250);
    expect(result.perHeadCost).toBe(6000);
  });

  it("uses the confirmed headcount when it exceeds expected guests", () => {
    const guests = asGuests([{ status: "confirmed", plusOnes: 299 }]);
    const result = calculateGuestMetrics(guests, 1500000, 250);
    expect(result.effectiveGuests).toBe(300);
    expect(result.perHeadCost).toBe(5000);
  });

  it("falls back to expected guests when the list is empty", () => {
    const result = calculateGuestMetrics([], 1500000, 250);
    expect(result.perHeadCost).toBe(6000);
  });

  it("returns a per-head cost of zero when there is no budget or no guests", () => {
    expect(calculateGuestMetrics([], 0, 250).perHeadCost).toBe(0);
    expect(calculateGuestMetrics([], 50000, 0).perHeadCost).toBe(0);
  });
});
