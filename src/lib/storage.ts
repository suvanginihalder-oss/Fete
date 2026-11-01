import { EventPlan } from "../types";

const STORAGE_KEY = "celebr_ai_saved_events";
const ACTIVE_EVENT_KEY = "celebr_ai_active_id";
const RATE_LIMIT_KEY = "celebr_ai_rate_quota";

const DAILY_LIMIT = 200;

export function getSavedPlans(): EventPlan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read saved events from localStorage:", e);
    return [];
  }
}

export function savePlanToStorage(plan: EventPlan): void {
  try {
    const existing = getSavedPlans();
    const index = existing.findIndex((p) => p.id === plan.id);
    let updated: EventPlan[];

    if (index >= 0) {
      updated = [...existing];
      updated[index] = { ...plan, updatedAt: new Date().toISOString() };
    } else {
      updated = [plan, ...existing];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(ACTIVE_EVENT_KEY, plan.id);
  } catch (e) {
    console.error("Failed to save plan to localStorage:", e);
  }
}

export function getPlanById(id: string): EventPlan | null {
  const plans = getSavedPlans();
  return plans.find((p) => p.id === id) || null;
}

export function getActivePlanId(): string | null {
  return localStorage.getItem(ACTIVE_EVENT_KEY);
}

export function setActivePlanId(id: string): void {
  localStorage.setItem(ACTIVE_EVENT_KEY, id);
}

export function deletePlanFromStorage(id: string): void {
  try {
    const existing = getSavedPlans();
    const updated = existing.filter((p) => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    if (getActivePlanId() === id) {
      localStorage.removeItem(ACTIVE_EVENT_KEY);
    }
  } catch (e) {
    console.error("Failed to delete plan:", e);
  }
}

export function exportPlansToJSON(): string {
  const plans = getSavedPlans();
  return JSON.stringify(plans, null, 2);
}

export function importPlansFromJSON(jsonText: string): {
  success: boolean;
  count: number;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonText);
    const plansArray = Array.isArray(parsed) ? parsed : [parsed];

    if (
      plansArray.length === 0 ||
      !plansArray[0].id ||
      !plansArray[0].concept
    ) {
      return {
        success: false,
        count: 0,
        error: "Invalid CelebrAI event backup file format",
      };
    }

    const current = getSavedPlans();
    const map = new Map<string, EventPlan>();
    current.forEach((p) => map.set(p.id, p));
    plansArray.forEach((p: EventPlan) => map.set(p.id, p));

    const combined = Array.from(map.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
    if (plansArray[0]?.id) {
      localStorage.setItem(ACTIVE_EVENT_KEY, plansArray[0].id);
    }

    return { success: true, count: plansArray.length };
  } catch (err: unknown) {
    return {
      success: false,
      count: 0,
      error: err instanceof Error ? err.message : "Corrupted JSON file",
    };
  }
}

/**
 * Demo Safety & Rate Limiting Guard
 */
export function checkRateQuota(): { allowed: boolean; remaining: number } {
  try {
    const today = new Date().toISOString().split("T")[0];
    const raw = localStorage.getItem(RATE_LIMIT_KEY);
    let record = raw ? JSON.parse(raw) : { date: today, count: 0 };

    if (record.date !== today) {
      record = { date: today, count: 0 };
    }

    if (record.count >= DAILY_LIMIT) {
      return { allowed: false, remaining: 0 };
    }

    record.count += 1;
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(record));
    return { allowed: true, remaining: DAILY_LIMIT - record.count };
  } catch (e) {
    return { allowed: true, remaining: DAILY_LIMIT };
  }
}
