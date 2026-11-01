import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getSavedPlans,
  savePlanToStorage,
  getPlanById,
  getActivePlanId,
  setActivePlanId,
  deletePlanFromStorage,
  exportPlansToJSON,
  importPlansFromJSON,
  checkRateQuota,
} from "../lib/storage";
import type { EventPlan } from "../types";

// Vitest runs in Node here, so provide a small in-memory localStorage.
class MemoryStorage {
  private store = new Map<string, string>();
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  clear(): void {
    this.store.clear();
  }
}

const STORAGE_KEY = "celebr_ai_saved_events";
const RATE_LIMIT_KEY = "celebr_ai_rate_quota";

function makePlan(id: string, tagline = "Test"): EventPlan {
  return {
    id,
    concept: { tagline },
    input: { name: `Event ${id}` },
  } as unknown as EventPlan;
}

let memory: MemoryStorage;

beforeEach(() => {
  memory = new MemoryStorage();
  vi.stubGlobal("localStorage", memory);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ─── Saved plans ─────────────────────────────────────────────────────────────

describe("getSavedPlans", () => {
  it("returns an empty list when nothing is saved", () => {
    expect(getSavedPlans()).toEqual([]);
  });

  it("returns an empty list when the stored data is corrupted", () => {
    memory.setItem(STORAGE_KEY, "{not valid json");
    expect(getSavedPlans()).toEqual([]);
  });
});

describe("savePlanToStorage", () => {
  it("saves a new plan and makes it the active plan", () => {
    savePlanToStorage(makePlan("a"));
    expect(getSavedPlans().map((p) => p.id)).toEqual(["a"]);
    expect(getActivePlanId()).toBe("a");
  });

  it("puts the newest plan first", () => {
    savePlanToStorage(makePlan("a"));
    savePlanToStorage(makePlan("b"));
    expect(getSavedPlans().map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("updates an existing plan instead of duplicating it", () => {
    savePlanToStorage(makePlan("a", "First"));
    savePlanToStorage(makePlan("a", "Second"));
    const plans = getSavedPlans();
    expect(plans.length).toBe(1);
    const saved = plans[0] as unknown as {
      concept: { tagline: string };
      updatedAt?: string;
    };
    expect(saved.concept.tagline).toBe("Second");
    expect(typeof saved.updatedAt).toBe("string");
    expect(Number.isNaN(Date.parse(saved.updatedAt as string))).toBe(false);
  });
});

describe("getPlanById and the active plan", () => {
  it("finds a saved plan by id and returns null for an unknown id", () => {
    savePlanToStorage(makePlan("a"));
    expect(getPlanById("a")?.id).toBe("a");
    expect(getPlanById("missing")).toBeNull();
  });

  it("stores and reads the active plan id", () => {
    expect(getActivePlanId()).toBeNull();
    setActivePlanId("xyz");
    expect(getActivePlanId()).toBe("xyz");
  });
});

describe("deletePlanFromStorage", () => {
  it("removes the plan and clears the active id if it was active", () => {
    savePlanToStorage(makePlan("a"));
    savePlanToStorage(makePlan("b")); // b is now active
    deletePlanFromStorage("b");
    expect(getSavedPlans().map((p) => p.id)).toEqual(["a"]);
    expect(getActivePlanId()).toBeNull();
  });

  it("keeps the active id when a different plan is deleted", () => {
    savePlanToStorage(makePlan("a"));
    savePlanToStorage(makePlan("b")); // b is active
    deletePlanFromStorage("a");
    expect(getActivePlanId()).toBe("b");
  });
});

// ─── Backup export and import ────────────────────────────────────────────────

describe("exportPlansToJSON", () => {
  it("exports saved plans as readable JSON", () => {
    savePlanToStorage(makePlan("a"));
    const json = exportPlansToJSON();
    expect(json).toContain("\n  ");
    const parsed = JSON.parse(json) as Array<{ id: string }>;
    expect(parsed.map((p) => p.id)).toEqual(["a"]);
  });

  it("exports an empty list when nothing is saved", () => {
    expect(JSON.parse(exportPlansToJSON())).toEqual([]);
  });
});

describe("importPlansFromJSON", () => {
  it("imports an array of plans and activates the first one", () => {
    const result = importPlansFromJSON(
      JSON.stringify([makePlan("a"), makePlan("b")]),
    );
    expect(result).toEqual({ success: true, count: 2 });
    expect(getSavedPlans().length).toBe(2);
    expect(getActivePlanId()).toBe("a");
  });

  it("accepts a single plan object", () => {
    const result = importPlansFromJSON(JSON.stringify(makePlan("solo")));
    expect(result).toEqual({ success: true, count: 1 });
    expect(getPlanById("solo")?.id).toBe("solo");
  });

  it("merges with existing plans and lets imported data win", () => {
    savePlanToStorage(makePlan("a", "Old"));
    savePlanToStorage(makePlan("keep"));
    importPlansFromJSON(JSON.stringify([makePlan("a", "New")]));
    const plans = getSavedPlans();
    expect(plans.length).toBe(2);
    const updated = getPlanById("a") as unknown as {
      concept: { tagline: string };
    };
    expect(updated.concept.tagline).toBe("New");
  });

  it("rejects files that are not CelebrAI backups", () => {
    const expected = {
      success: false,
      count: 0,
      error: "Invalid CelebrAI event backup file format",
    };
    expect(importPlansFromJSON(JSON.stringify([{ hello: "world" }]))).toEqual(
      expected,
    );
    expect(importPlansFromJSON("[]")).toEqual(expected);
  });

  it("reports an error for corrupted JSON and saves nothing", () => {
    const result = importPlansFromJSON("{broken json");
    expect(result.success).toBe(false);
    expect(result.count).toBe(0);
    expect(typeof result.error).toBe("string");
    expect((result.error ?? "").length).toBeGreaterThan(0);
    expect(getSavedPlans()).toEqual([]);
  });
});

// ─── Daily quota guard ───────────────────────────────────────────────────────

describe("checkRateQuota", () => {
  const today = () => new Date().toISOString().split("T")[0];

  it("allows the first request and counts down the remaining quota", () => {
    expect(checkRateQuota()).toEqual({ allowed: true, remaining: 199 });
    expect(checkRateQuota()).toEqual({ allowed: true, remaining: 198 });
  });

  it("blocks requests once the daily limit is reached", () => {
    memory.setItem(
      RATE_LIMIT_KEY,
      JSON.stringify({ date: today(), count: 200 }),
    );
    expect(checkRateQuota()).toEqual({ allowed: false, remaining: 0 });
  });

  it("allows the last request and then blocks the next one", () => {
    memory.setItem(
      RATE_LIMIT_KEY,
      JSON.stringify({ date: today(), count: 199 }),
    );
    expect(checkRateQuota()).toEqual({ allowed: true, remaining: 0 });
    expect(checkRateQuota().allowed).toBe(false);
  });

  it("resets the count on a new day", () => {
    memory.setItem(
      RATE_LIMIT_KEY,
      JSON.stringify({ date: "2000-01-01", count: 200 }),
    );
    expect(checkRateQuota()).toEqual({ allowed: true, remaining: 199 });
  });

  it("allows requests if the stored quota data is corrupted", () => {
    memory.setItem(RATE_LIMIT_KEY, "{bad json");
    expect(checkRateQuota()).toEqual({ allowed: true, remaining: 200 });
  });
});
