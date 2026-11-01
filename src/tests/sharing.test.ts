import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import LZString from "lz-string";
import {
  encodePlanToUrl,
  decodePlanFromUrl,
  generateInvitationText,
  generateWhatsAppLink,
  triggerPrint,
} from "../lib/sharing";
import type { InvitationTone } from "../lib/sharing";
import type { EventPlan } from "../types";

function makePlan(inputOverrides: Record<string, unknown> = {}): EventPlan {
  return {
    id: "plan-1",
    concept: { tagline: "Neon Nights" },
    input: {
      name: "Aura '26",
      // Mid-month date so the formatted text is stable in any time zone.
      date: "2026-06-15",
      city: "Bengaluru",
      theme: "Retro Neon Waves",
      ...inputOverrides,
    },
  } as unknown as EventPlan;
}

beforeEach(() => {
  vi.stubGlobal("window", {
    location: {
      origin: "https://fete-pink.vercel.app",
      pathname: "/",
      href: "https://fete-pink.vercel.app/",
    },
    print: vi.fn(),
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ─── Share links ─────────────────────────────────────────────────────────────

describe("encodePlanToUrl and decodePlanFromUrl", () => {
  it("builds a URL with a share parameter on the current page", () => {
    const url = encodePlanToUrl(makePlan());
    expect(url.startsWith("https://fete-pink.vercel.app/?share=")).toBe(true);
  });

  it("round-trips a plan without losing data", () => {
    const plan = makePlan();
    const url = encodePlanToUrl(plan);
    const shared = new URL(url).searchParams.get("share");
    expect(shared).not.toBeNull();
    expect(decodePlanFromUrl(shared as string)).toEqual(plan);
  });

  it("round-trips text with emoji and special characters", () => {
    const plan = makePlan({ name: "Priya & Rahul's 🎉 Sangeet", city: "Chennai" });
    const url = encodePlanToUrl(plan);
    const shared = new URL(url).searchParams.get("share") as string;
    expect(decodePlanFromUrl(shared)).toEqual(plan);
  });

  it("falls back to the current address if encoding fails", () => {
    vi.stubGlobal("window", {
      location: { origin: "", pathname: "", href: "fallback-href" },
    });
    expect(encodePlanToUrl(makePlan())).toBe("fallback-href");
  });

  it("returns null for an empty or corrupted link", () => {
    expect(decodePlanFromUrl("")).toBeNull();
    expect(decodePlanFromUrl("this-is-not-a-valid-link")).toBeNull();
  });

  it("returns null when the decoded data is not a plan", () => {
    const noId = LZString.compressToEncodedURIComponent(
      JSON.stringify({ concept: {} }),
    );
    const noConcept = LZString.compressToEncodedURIComponent(
      JSON.stringify({ id: "x" }),
    );
    expect(decodePlanFromUrl(noId)).toBeNull();
    expect(decodePlanFromUrl(noConcept)).toBeNull();
  });
});

// ─── Invitations ─────────────────────────────────────────────────────────────

describe("generateInvitationText", () => {
  it("defaults to the formal tone", () => {
    const plan = makePlan();
    expect(generateInvitationText(plan)).toBe(
      generateInvitationText(plan, "formal"),
    );
  });

  it("includes the event details in every tone", () => {
    const tones: InvitationTone[] = ["formal", "casual", "poetic", "funky"];
    for (const tone of tones) {
      const text = generateInvitationText(makePlan(), tone);
      expect(text).toContain("Aura '26");
      expect(text).toContain("Bengaluru");
      expect(text).toContain("Retro Neon Waves");
      expect(text).toContain("2026");
      expect(text).toContain("June");
    }
  });

  it("writes a different message for each tone", () => {
    const tones: InvitationTone[] = ["formal", "casual", "poetic", "funky"];
    const texts = new Set(tones.map((t) => generateInvitationText(makePlan(), t)));
    expect(texts.size).toBe(4);
  });

  it("uses a recognizable opening for each tone", () => {
    expect(generateInvitationText(makePlan(), "formal")).toContain("Honored Guests");
    expect(generateInvitationText(makePlan(), "casual")).toContain("Hey everyone!");
    expect(generateInvitationText(makePlan(), "poetic")).toContain("Join us under glowing lights");
    expect(generateInvitationText(makePlan(), "funky")).toContain("IT'S CELEBRATION TIME!");
  });

  it("uses a fallback theme line when no theme is set", () => {
    const plan = makePlan({ theme: "" });
    expect(generateInvitationText(plan, "formal")).toContain("Celebratory Attire");
    expect(generateInvitationText(plan, "casual")).toContain("Come as you are & festive");
    expect(generateInvitationText(plan, "poetic")).toContain("Festive Radiance");
    expect(generateInvitationText(plan, "funky")).toContain("Ultra Cool & Vibrant");
  });
});

// ─── WhatsApp and print ──────────────────────────────────────────────────────

describe("generateWhatsAppLink", () => {
  it("builds a click-to-chat link with the encoded message", () => {
    const text = "Hello & welcome\n100% fun 🎉";
    const link = generateWhatsAppLink(text);
    const prefix = "https://api.whatsapp.com/send?text=";
    expect(link.startsWith(prefix)).toBe(true);
    expect(decodeURIComponent(link.slice(prefix.length))).toBe(text);
  });

  it("does not leave raw spaces or newlines in the URL", () => {
    const link = generateWhatsAppLink("two words\nnew line");
    expect(link).not.toContain(" ");
    expect(link).not.toContain("\n");
  });
});

describe("triggerPrint", () => {
  it("opens the browser print dialog", () => {
    triggerPrint();
    expect((window as unknown as { print: () => void }).print).toHaveBeenCalledTimes(1);
  });
});
