import type {
  EventFormInput,
  SectionKey,
  EventPlan,
  BudgetSummary,
  TimelineTask,
  EventDayScheduleItem,
  VendorItem,
  WeatherPlanB,
  ConceptData,
} from "../../types";
import {
  callSectionAIStrict,
  generateLocalSectionData,
} from "./providerAdapter.js";
import { rescaleBudgetLines, computeTimelineDates } from "../math.js";

export interface ParallelPlanCallbacks {
  onSectionStart: (section: SectionKey) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSectionSuccess: (section: SectionKey, data: any, isDemo: boolean) => void;
  onSectionError: (section: SectionKey, error: string) => void;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Requests one section from the AI. If the first attempt fails, tries once more.
 * If both fail, that section alone falls back to the local sample generator,
 * so the other sections can still be live AI.
 */
export async function fetchSectionWithSingleRetry<T>(
  section: SectionKey,
  input: EventFormInput,
  callbacks: ParallelPlanCallbacks,
): Promise<{ data: T; isDemo: boolean }> {
  callbacks.onSectionStart(section);

  try {
    const result = await callSectionAIStrict<T>(section, input);
    callbacks.onSectionSuccess(section, result.data, result.isDemo);
    return result;
  } catch (firstErr: unknown) {
    console.warn(
      `[CelebrAI] "${section}" failed, retrying once: ${errorMessage(firstErr)}`,
    );
    try {
      const retryResult = await callSectionAIStrict<T>(section, input);
      callbacks.onSectionSuccess(section, retryResult.data, retryResult.isDemo);
      return retryResult;
    } catch (retryErr: unknown) {
      const reason = errorMessage(retryErr);
      console.warn(
        `[CelebrAI] "${section}" fell back to sample data: ${reason}`,
      );
      // Fall back to the safe local generator rather than showing a broken state.
      const fallbackData = generateLocalSectionData(section, input);
      callbacks.onSectionSuccess(section, fallbackData, true);
      return { data: fallbackData as T, isDemo: true };
    }
  }
}

export async function generateFullParallelPlan(
  input: EventFormInput,
  callbacks: ParallelPlanCallbacks,
): Promise<EventPlan> {
  // Execute all 4 sections in parallel
  const [conceptRes, budgetRes, timelineRes, vendorRes] = await Promise.all([
    fetchSectionWithSingleRetry<ConceptData>("concept", input, callbacks),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetchSectionWithSingleRetry<{ lines: any[] }>("budget", input, callbacks),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fetchSectionWithSingleRetry<{ tasks: any[]; daySchedule: any[] }>(
      "timeline",
      input,
      callbacks,
    ),
    fetchSectionWithSingleRetry<{
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vendors: any[];
      expertTips: string[];
      weatherPlanB: WeatherPlanB;
    }>("vendors", input, callbacks),
  ]);

  const isAnyDemo =
    conceptRes.isDemo ||
    budgetRes.isDemo ||
    timelineRes.isDemo ||
    vendorRes.isDemo;

  // Code owns the math
  const budgetSummary: BudgetSummary = rescaleBudgetLines(
    budgetRes.data.lines,
    input.budget,
  );
  const timelineTasks: TimelineTask[] = computeTimelineDates(
    timelineRes.data.tasks,
    input.date,
  );

  const daySchedule: EventDayScheduleItem[] = (
    timelineRes.data.daySchedule || []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ).map((item: any, idx: number) => ({
    id: item.id || `sched-${idx}-${Date.now()}`,
    time: item.time || "10:00 AM",
    activity: item.activity || "Activity",
    owner: item.owner || "Host",
    notes: item.notes || "",
  }));

  const vendors: VendorItem[] = (vendorRes.data.vendors || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (v: any, idx: number) => ({
      id: `v-${idx}-${Date.now()}`,
      serviceType: v.serviceType || "Vendor Service",
      estCostRange: v.estCostRange || "Price on request",
      questionsToAsk: v.questionsToAsk || [],
      status: "not_contacted" as const,
    }),
  );

  const planId = `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: planId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemoMode: isAnyDemo,
    demoBannerMessage: isAnyDemo
      ? "Sample plan, not live AI (Protected by Demo Safety Mode)"
      : undefined,
    input,
    concept: conceptRes.data,
    budget: budgetSummary,
    timeline: timelineTasks,
    daySchedule,
    vendors,
    expertTips: vendorRes.data.expertTips || [],
    weatherPlanB: vendorRes.data.weatherPlanB || {
      riskAssessment: "Standard seasonal weather risks assessed.",
      contingencySteps: [
        "Prepare indoor transition plan.",
        "Have water-proof covers ready.",
      ],
      backupVenuesOrGear: ["Indoor banquet space", "Tarpaulins"],
    },
    guests: [
      {
        id: "g-init-1",
        name: "Primary Host",
        emailOrPhone: "host@celebr.ai",
        status: "confirmed",
        dietaryNote: input.dietary[0] || "",
        plusOnes: 1,
      },
      {
        id: "g-init-2",
        name: "Key Guest / Co-organizer",
        emailOrPhone: "guest@celebr.ai",
        status: "confirmed",
        dietaryNote: "",
        plusOnes: 0,
      },
    ],
  };
}
