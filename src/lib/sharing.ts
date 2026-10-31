import LZString from "lz-string";
import { EventPlan } from "../types";

export type InvitationTone = "formal" | "casual" | "poetic" | "funky";

/**
 * Encodes an EventPlan into a compressed URL hash/query string for zero-backend sharing.
 */
export function encodePlanToUrl(plan: EventPlan): string {
  try {
    const jsonString = JSON.stringify(plan);
    const compressed = LZString.compressToEncodedURIComponent(jsonString);
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("share", compressed);
    return url.toString();
  } catch (err) {
    console.error("Failed to encode plan:", err);
    return window.location.href;
  }
}

/**
 * Decodes compressed plan from the URL search param
 */
export function decodePlanFromUrl(compressedStr: string): EventPlan | null {
  try {
    const decompressed =
      LZString.decompressFromEncodedURIComponent(compressedStr);
    if (!decompressed) return null;
    const plan = JSON.parse(decompressed);
    if (!plan.id || !plan.concept) return null;
    return plan;
  } catch (err) {
    console.error("Failed to decode shared plan:", err);
    return null;
  }
}

/**
 * Generates customizable invitation message across 4 distinct tones
 */
export function generateInvitationText(
  plan: EventPlan,
  tone: InvitationTone = "formal",
): string {
  const { name, date, city, theme } = plan.input;
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  switch (tone) {
    case "formal":
      return `Honored Guests,

You are cordially invited to celebrate:
${name}

Date: ${formattedDate}
Location: ${city}
Theme: ${theme || "Celebratory Attire"}

Your gracious presence will bring warmth to our celebration. Kindly confirm your attendance and any dietary requirements by RSVP.

Warm regards,
Event Organizers`;

    case "casual":
      return `Hey everyone! 🎉

We're gathering to celebrate ${name}!
Mark your calendars: ${formattedDate} in ${city}.
Vibe / Dress Code: ${theme || "Come as you are & festive"}

Good food, great music, and unforgettable moments guaranteed. Let us know if you can make it!

RSVP soon! 🙌`;

    case "poetic":
      return `✨ "Moments fade, but memories woven with love and laughter endure forever." ✨

Join us under glowing lights to celebrate:
🌸 ${name} 🌸

When: ${formattedDate}
Where: ${city}
Theme: ${theme || "Festive Radiance"}

Let your presence be the melody to our shared joy. Please RSVP at your earliest convenience.`;

    case "funky":
      return `🚀 IT'S CELEBRATION TIME! ⚡
${name} is officially happening!

📅 Date: ${formattedDate}
📍 Spot: ${city}
🎨 Mood: ${theme || "Ultra Cool & Vibrant"}

Bring your highest energy, dancing shoes, and biggest smiles. Confirm your spot right now! 🕺💃`;
  }
}

/**
 * Builds a direct WhatsApp click-to-chat share URL
 */
export function generateWhatsAppLink(text: string): string {
  const encoded = encodeURIComponent(text);
  return `https://api.whatsapp.com/send?text=${encoded}`;
}

/**
 * Clean browser print invocation
 */
export function triggerPrint() {
  window.print();
}
