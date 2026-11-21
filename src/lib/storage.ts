import LZString from "lz-string";
import type { HouseholdProfile } from "../types/index.js";
import {
  DEFAULT_DELHI_PROFILE,
  HouseholdProfileSchema,
} from "../types/index.js";

const STORAGE_KEY_PROFILE = "airwise_household_profile";
const STORAGE_KEY_SAVED_CITIES = "airwise_saved_cities";
const STORAGE_KEY_ROUTINE_TASKS = "airwise_checked_tasks_";

/**
 * Loads saved household profile or returns default
 */
export function loadHouseholdProfile(): HouseholdProfile {
  if (typeof window === "undefined") return DEFAULT_DELHI_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (!raw) return DEFAULT_DELHI_PROFILE;
    const parsed = JSON.parse(raw);
    const result = HouseholdProfileSchema.safeParse(parsed);
    return result.success ? result.data : DEFAULT_DELHI_PROFILE;
  } catch {
    return DEFAULT_DELHI_PROFILE;
  }
}

/**
 * Saves profile to localStorage
 */
export function saveHouseholdProfile(profile: HouseholdProfile): boolean {
  if (typeof window === "undefined") return false;
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    addSavedCity(profile.city);
    return true;
  } catch {
    return false;
  }
}

/**
 * Manages list of saved cities
 */
export function getSavedCities(): string[] {
  if (typeof window === "undefined")
    return ["Delhi", "Mumbai", "Kolkata", "Bengaluru"];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_CITIES);
    if (!raw) return ["Delhi", "Mumbai", "Kolkata", "Bengaluru"];
    return JSON.parse(raw);
  } catch {
    return ["Delhi", "Mumbai", "Kolkata", "Bengaluru"];
  }
}

export function addSavedCity(city: string): void {
  if (typeof window === "undefined" || !city) return;
  try {
    const cities = getSavedCities();
    const cleanCity = city.trim();
    if (!cities.some((c) => c.toLowerCase() === cleanCity.toLowerCase())) {
      const updated = [cleanCity, ...cities].slice(0, 8);
      localStorage.setItem(STORAGE_KEY_SAVED_CITIES, JSON.stringify(updated));
    }
  } catch {
    // ignore
  }
}

/**
 * Encodes a household profile into a compressed URL-safe string
 */
export function encodeProfileShareUrl(profile: HouseholdProfile): string {
  const json = JSON.stringify(profile);
  const compressed = LZString.compressToEncodedURIComponent(json);
  if (typeof window !== "undefined") {
    return `${window.location.origin}${window.location.pathname}?share=${compressed}`;
  }
  return `?share=${compressed}`;
}

/**
 * Decodes a profile from a share URL parameter
 */
export function decodeProfileShareUrl(param: string): HouseholdProfile | null {
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(param);
    if (!decompressed) return null;
    const obj = JSON.parse(decompressed);
    const res = HouseholdProfileSchema.safeParse(obj);
    return res.success ? res.data : null;
  } catch {
    return null;
  }
}

/**
 * Persists checked tasks for today's routine
 */
export function loadCheckedTasks(dateKey: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_ROUTINE_TASKS}${dateKey}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCheckedTasks(
  dateKey: string,
  tasks: Record<string, boolean>,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${STORAGE_KEY_ROUTINE_TASKS}${dateKey}`,
      JSON.stringify(tasks),
    );
  } catch {
    // ignore
  }
}
