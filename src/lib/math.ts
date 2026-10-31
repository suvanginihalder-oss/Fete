import {
  BudgetLine,
  BudgetSummary,
  RawTimelineTask,
  TimelineTask,
  GuestItem,
} from "../types";

/**
 * Rescales budget lines to ensure their integer allocations sum EXACTLY to the new total.
 * Recalculates percentages, actual amounts, remaining funds, and health warnings.
 */
export function rescaleBudgetLines(
  lines: Array<Partial<BudgetLine>>,
  newTotalBudget: number,
): BudgetSummary {
  const targetTotal = Math.max(0, Math.round(newTotalBudget));

  if (!lines || lines.length === 0) {
    return {
      totalBudget: targetTotal,
      lines: [],
      totalAllocated: 0,
      totalActual: 0,
      remainingBudget: targetTotal,
      isOverBudget: false,
      overBudgetAmount: 0,
      warnings: ["No budget categories defined."],
    };
  }

  const rawSum = lines.reduce(
    (sum, item) => sum + Math.max(0, item.allocatedAmount ?? 0),
    0,
  );

  // If rawSum is 0, split evenly across all lines
  const initialAllocations = lines.map((line, idx) => {
    let allocated = 0;
    if (rawSum > 0) {
      allocated = Math.round(
        ((line.allocatedAmount ?? 0) / rawSum) * targetTotal,
      );
    } else {
      allocated = Math.floor(targetTotal / lines.length);
      if (idx === 0) {
        allocated += targetTotal % lines.length;
      }
    }
    return {
      ...line,
      allocated,
    };
  });

  // Calculate rounding discrepancy
  const allocatedSum = initialAllocations.reduce(
    (sum, l) => sum + l.allocated,
    0,
  );
  const discrepancy = targetTotal - allocatedSum;

  // Add/subtract discrepancy from the item with the highest allocation
  let highestIdx = 0;
  let maxAlloc = -1;
  initialAllocations.forEach((item, idx) => {
    if (item.allocated > maxAlloc) {
      maxAlloc = item.allocated;
      highestIdx = idx;
    }
  });

  if (initialAllocations[highestIdx]) {
    initialAllocations[highestIdx].allocated = Math.max(
      0,
      initialAllocations[highestIdx].allocated + discrepancy,
    );
  }

  // Final sanitized lines
  const finalLines: BudgetLine[] = initialAllocations.map((item, idx) => {
    const allocatedAmount = Math.max(0, item.allocated);
    const actualAmount = Math.max(0, item.actualAmount ?? 0);
    const percentage =
      targetTotal > 0 ? Math.round((allocatedAmount / targetTotal) * 100) : 0;
    const potentialSavings =
      item.potentialSavings ?? Math.round(allocatedAmount * 0.15);

    return {
      id: item.id || `b-line-${idx}-${Date.now()}`,
      category: item.category || "General",
      item: item.item || `Item ${idx + 1}`,
      allocatedAmount,
      actualAmount,
      percentage,
      isCheaperAlternativeAvailable: Boolean(
        item.isCheaperAlternativeAvailable,
      ),
      cheaperAlternativeNote:
        item.cheaperAlternativeNote ||
        "Bulk vendor discounts or DIY options available.",
      potentialSavings,
    };
  });

  const totalAllocated = finalLines.reduce(
    (acc, l) => acc + l.allocatedAmount,
    0,
  );
  const totalActual = finalLines.reduce((acc, l) => acc + l.actualAmount, 0);

  // Total actual vs total budget determines if over-budget
  const isOverBudget = totalActual > targetTotal;
  const overBudgetAmount = Math.max(0, totalActual - targetTotal);
  const remainingBudget = Math.max(0, targetTotal - totalActual);

  // Generate warnings
  const warnings: string[] = [];
  if (isOverBudget) {
    warnings.push(
      `Total actual spend exceeds budget by ${overBudgetAmount.toLocaleString()}.`,
    );
  }

  // Check for high category concentration (> 45%)
  finalLines.forEach((line) => {
    if (line.percentage >= 45) {
      warnings.push(
        `"${line.category}" represents ${line.percentage}% of the entire budget.`,
      );
    }
  });

  // Check if buffer/contingency exists
  const hasContingency = finalLines.some(
    (l) =>
      l.category.toLowerCase().includes("contingency") ||
      l.category.toLowerCase().includes("buffer") ||
      l.category.toLowerCase().includes("emergency"),
  );
  if (!hasContingency) {
    warnings.push(
      "Recommendation: Reserve 5-10% in an emergency buffer / contingency fund.",
    );
  }

  return {
    totalBudget: targetTotal,
    lines: finalLines,
    totalAllocated,
    totalActual,
    remainingBudget,
    isOverBudget,
    overBudgetAmount,
    warnings,
  };
}

function parseYMD(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatYMD(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Converts dueOffsetDays (e.g. 30 days before event) into real calendar dates (YYYY-MM-DD).
 * Compresses timeline and flags overdue tasks if event is too close.
 */
export function computeTimelineDates(
  tasks: RawTimelineTask[],
  eventDateStr: string,
  referenceDate: Date = new Date(),
): TimelineTask[] {
  const eventDate = parseYMD(eventDateStr);
  const refDate = new Date(
    Date.UTC(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
    ),
  );

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysUntilEvent = Math.max(
    0,
    Math.round((eventDate.getTime() - refDate.getTime()) / msPerDay),
  );

  return tasks
    .map((task, idx) => {
      let offsetDays = task.dueOffsetDays;
      let isCompressed = false;

      // If offset is greater than total days available until event, compress it!
      if (offsetDays > daysUntilEvent) {
        isCompressed = true;
        // compress to a proportional fraction or minimum of 1 day before
        offsetDays = Math.max(
          0,
          Math.min(
            daysUntilEvent,
            Math.round((offsetDays / 60) * daysUntilEvent),
          ),
        );
      }

      const targetDateObj = new Date(
        eventDate.getTime() - offsetDays * msPerDay,
      );
      const isOverdue = targetDateObj.getTime() < refDate.getTime();
      const targetDate = formatYMD(targetDateObj);

      return {
        ...task,
        id: `task-${idx}-${Date.now()}`,
        dueOffsetDays: offsetDays,
        targetDate,
        completed: false,
        isOverdue,
        isCompressed,
      };
    })
    .sort((a, b) => a.targetDate.localeCompare(b.targetDate));
}

/**
 * Calculates task progress metrics
 */
export function calculateProgress(tasks: Array<{ completed: boolean }>): {
  total: number;
  completed: number;
  percentage: number;
} {
  const total = tasks.length;
  if (total === 0) return { total: 0, completed: 0, percentage: 0 };
  const completed = tasks.filter((t) => t.completed).length;
  const percentage = Math.round((completed / total) * 100);
  return { total, completed, percentage };
}

/**
 * Calculates guest headcount and per-head cost metrics
 */
export function calculateGuestMetrics(
  guests: GuestItem[],
  totalBudget: number,
  expectedGuests: number,
) {
  const confirmedList = guests.filter((g) => g.status === "confirmed");
  const pendingList = guests.filter((g) => g.status === "pending");
  const declinedList = guests.filter((g) => g.status === "declined");

  const confirmedHeadcount = confirmedList.reduce(
    (acc, g) => acc + 1 + (g.plusOnes || 0),
    0,
  );
  const pendingHeadcount = pendingList.reduce(
    (acc, g) => acc + 1 + (g.plusOnes || 0),
    0,
  );
  const declinedHeadcount = declinedList.reduce(
    (acc, g) => acc + 1 + (g.plusOnes || 0),
    0,
  );

  const totalHeadcount = confirmedHeadcount + pendingHeadcount;
  const effectiveGuests =
    confirmedHeadcount > 0 ? confirmedHeadcount : expectedGuests;
  const perHeadCost =
    totalBudget > 0 && effectiveGuests > 0
      ? Math.round(totalBudget / effectiveGuests)
      : 0;

  // Dietary counts breakdown
  const dietaryCounts: Record<string, number> = {};
  guests.forEach((g) => {
    if (g.dietaryNote && g.dietaryNote.trim()) {
      const note = g.dietaryNote.trim();
      dietaryCounts[note] = (dietaryCounts[note] || 0) + 1 + (g.plusOnes || 0);
    }
  });

  return {
    confirmed: confirmedHeadcount,
    pending: pendingHeadcount,
    declined: declinedHeadcount,
    totalHeadcount,
    effectiveGuests,
    perHeadCost,
    dietaryCounts,
  };
}
