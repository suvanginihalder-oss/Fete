import { describe, it, expect } from "vitest";
import {
  rescaleBudgetLines,
  computeTimelineDates,
  calculateProgress,
  calculateGuestMetrics,
} from "../lib/math";
import { RawTimelineTask, GuestItem } from "../types";

describe("Code-Owned Math: Budget Rescaling", () => {
  it("rescales lines to sum EXACTLY to the new total budget without penny loss", () => {
    const rawLines = [
      {
        id: "1",
        category: "Catering",
        item: "Buffet",
        allocatedAmount: 30000,
        actualAmount: 0,
      },
      {
        id: "2",
        category: "Decor",
        item: "Stage setup",
        allocatedAmount: 15000,
        actualAmount: 0,
      },
      {
        id: "3",
        category: "Sound",
        item: "DJ & PA",
        allocatedAmount: 5000,
        actualAmount: 0,
      },
    ];
    // Total original was 50,000. Rescale to 73,421 (odd prime number)
    const summary = rescaleBudgetLines(rawLines, 73421);

    expect(summary.totalBudget).toBe(73421);
    const sumAllocated = summary.lines.reduce(
      (acc, l) => acc + l.allocatedAmount,
      0,
    );
    expect(sumAllocated).toBe(73421);
  });

  it("handles zero budget safely", () => {
    const rawLines = [
      { id: "1", category: "Decor", allocatedAmount: 5000 },
      { id: "2", category: "Food", allocatedAmount: 5000 },
    ];
    const summary = rescaleBudgetLines(rawLines, 0);
    expect(summary.totalBudget).toBe(0);
    expect(summary.lines.reduce((acc, l) => acc + l.allocatedAmount, 0)).toBe(
      0,
    );
  });

  it("flags over-budget when actual spend exceeds total budget", () => {
    const rawLines = [
      {
        id: "1",
        category: "Venue",
        allocatedAmount: 20000,
        actualAmount: 26000,
      },
      {
        id: "2",
        category: "Food",
        allocatedAmount: 20000,
        actualAmount: 22000,
      },
    ];
    const summary = rescaleBudgetLines(rawLines, 40000);
    expect(summary.isOverBudget).toBe(true);
    expect(summary.overBudgetAmount).toBe(8000);
    expect(summary.warnings.some((w) => w.includes("exceeds budget"))).toBe(
      true,
    );
  });

  it("generates high concentration warning when a category exceeds 45%", () => {
    const rawLines = [
      { id: "1", category: "Mega Production Stage", allocatedAmount: 70000 },
      { id: "2", category: "Snacks", allocatedAmount: 30000 },
    ];
    const summary = rescaleBudgetLines(rawLines, 100000);
    expect(
      summary.warnings.some((w) => w.includes("70% of the entire budget")),
    ).toBe(true);
  });
});

describe("Code-Owned Math: Timeline Dates and Compression", () => {
  it("converts dueOffsetDays into exact calendar dates", () => {
    const eventDate = "2026-12-01";
    const refDate = new Date("2026-10-01");
    const tasks: RawTimelineTask[] = [
      {
        title: "Book Venue",
        category: "Logistics",
        dueOffsetDays: 30,
        priority: "high",
      },
      {
        title: "Send Invites",
        category: "Guests",
        dueOffsetDays: 14,
        priority: "medium",
      },
    ];

    const result = computeTimelineDates(tasks, eventDate, refDate);
    expect(result).toHaveLength(2);
    // Exactly 30 days before Dec 1 in UTC is Nov 1
    expect(result[0].targetDate).toBe("2026-11-01");
    // Exactly 14 days before Dec 1 is Nov 17
    expect(result[1].targetDate).toBe("2026-11-17");
    expect(result[0].isOverdue).toBe(false);
  });

  it("compresses timeline when event is closer than dueOffsetDays", () => {
    const eventDate = "2026-10-10"; // 5 days from refDate
    const refDate = new Date("2026-10-05");
    const tasks: RawTimelineTask[] = [
      {
        title: "Catering Tasting",
        category: "Food",
        dueOffsetDays: 20,
        priority: "high",
      },
    ];

    const result = computeTimelineDates(tasks, eventDate, refDate);
    expect(result[0].isCompressed).toBe(true);
    expect(result[0].dueOffsetDays).toBeLessThanOrEqual(5);
  });
});

describe("Code-Owned Math: Progress and Guest Metrics", () => {
  it("calculates task completion percentage accurately", () => {
    const tasks = [
      { completed: true },
      { completed: true },
      { completed: false },
      { completed: false },
    ];
    const progress = calculateProgress(tasks);
    expect(progress.total).toBe(4);
    expect(progress.completed).toBe(2);
    expect(progress.percentage).toBe(50);
  });

  it("computes guest headcount and per-head cost correctly", () => {
    const guests: GuestItem[] = [
      {
        id: "1",
        name: "John Doe",
        emailOrPhone: "j@d.com",
        status: "confirmed",
        dietaryNote: "Pure Veg",
        plusOnes: 1,
      },
      {
        id: "2",
        name: "Jane Smith",
        emailOrPhone: "j@s.com",
        status: "confirmed",
        dietaryNote: "Jain Option",
        plusOnes: 0,
      },
      {
        id: "3",
        name: "Bob Wilson",
        emailOrPhone: "b@w.com",
        status: "declined",
        dietaryNote: "",
        plusOnes: 2,
      },
      {
        id: "4",
        name: "Alice Ray",
        emailOrPhone: "a@r.com",
        status: "pending",
        dietaryNote: "Pure Veg",
        plusOnes: 0,
      },
    ];

    const metrics = calculateGuestMetrics(guests, 60000, 50);
    // Confirmed: John (+1) + Jane = 3
    expect(metrics.confirmed).toBe(3);
    // Pending: Alice = 1
    expect(metrics.pending).toBe(1);
    // Declined: Bob (+2) = 3
    expect(metrics.declined).toBe(3);
    // Per head cost: 60,000 / 3 confirmed guests = 20,000
    expect(metrics.perHeadCost).toBe(1200);
    // Dietary: 'Pure Veg': 2 (John+1) + 1 (Alice pending) = 3
    expect(metrics.dietaryCounts["Pure Veg"]).toBe(3);
    expect(metrics.dietaryCounts["Jain Option"]).toBe(1);
  });
});
