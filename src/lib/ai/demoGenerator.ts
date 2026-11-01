import type {
  EventFormInput,
  ConceptData,
  RawTimelineTask,
  EventDayScheduleItem,
  RawVendorItem,
  WeatherPlanB,
} from "../../types";

export function generateDemoConcept(input: EventFormInput): ConceptData {
  const typeMap: Record<
    string,
    { vibe: string; decorTitle: string; foodTitle: string; entTitle: string }
  > = {
    wedding: {
      vibe: "Timeless Romance with Opulent Festive Flair",
      decorTitle: "Floral Mandap & Fairy Canopy",
      foodTitle: "Royal Multi-Course Feast & Live Counters",
      entTitle: "Sangeet Choreography & Live Sufi-Acoustic Band",
    },
    birthday: {
      vibe: "Vibrant Celebration with Interactive Spark",
      decorTitle: "Balloon Sculptures, Neon Signage & Photobooth",
      foodTitle: "Artisanal Grazing Table, Custom Cake & Mocktails",
      entTitle: "Interactive Emcee, DJ & Dance Showcase",
    },
    anniversary: {
      vibe: "Elegant Nostalgia & Modern Sophistication",
      decorTitle: "Candlelit Vintage Tablescapes & Memory Lane Wall",
      foodTitle: "Curated Plated Dinner & Wine/Mocktail Pairing",
      entTitle: "Violin/Saxophone Duet & Retro Dance Floor",
    },
    college_fest: {
      vibe: "High-Octane Youth Fusion & Indie Power",
      decorTitle: "Modular Neon Shapes, Glow Wire & Banner Drops",
      foodTitle: "Fast Street Food Chaat, Burgers & Refreshment Hubs",
      entTitle: "Battle of the Bands, EDM Sunset & Street Plays",
    },
    community: {
      vibe: "Inclusive Warmth & Cultural Heritage",
      decorTitle: "Eco-Friendly Torans, Bunting & Folk Motifs",
      foodTitle: "Community Langar / Traditional Thali Spread",
      entTitle: "Folk Troupe, Talent Showcase & Story Circles",
    },
  };

  const selected = typeMap[input.eventType] || typeMap.community;
  const dietaryText =
    input.dietary.length > 0
      ? input.dietary.join(", ")
      : "Standard accommodating";

  return {
    tagline: `${input.name}: ${selected.vibe} in ${input.city}`,
    decor: [
      {
        title: selected.decorTitle,
        description: `Theme-aligned styling featuring ${input.theme || "signature elegance"}, custom stage backdrops, and photo-ready lighting accents.`,
        estCostSharePercent: 22,
        items: [
          `Thematic entrance arch welcoming ${input.guests} guests`,
          "Warm ambient uplighting and LED wash fixtures",
          "Eco-friendly floral and textile accents tailored to the venue",
        ],
      },
      {
        title: "Intimate Guest Lounges & Seating Vignettes",
        description: `Comfortable seating layouts with dedicated accessible pathways for all attendees.`,
        estCostSharePercent: 12,
        items: [
          "High-top cocktail tables and plush lounge clusters",
          "Personalized table runners and festive centerpiece florals",
          "Clear directional signage for restrooms, dining, and stages",
        ],
      },
    ],
    food: {
      title: selected.foodTitle,
      description: `Delicious culinary spread catering specifically to ${dietaryText} preferences with fresh local ${input.city} flavors.`,
      highlights: [
        "Signature welcome mocktails & regional artisanal appetisers",
        "Live chef stations with freshly prepared hot entrees",
        "Dessert bar featuring artisanal warm & chilled festive specialties",
      ],
      dietaryAccommodations: `Full adherence to requested dietary requirements (${dietaryText}) with labeled stations and dedicated kitchen utensils.`,
    },
    entertainment: {
      title: selected.entTitle,
      description: `Carefully curated program honoring cultural preferences: ${input.culturalPreferences || "Engaging modern music & celebratory performances"}.`,
      scheduleSuggestion:
        "Warm acoustic greeting -> Core ceremonial spotlight -> High energy dance celebration",
      highlights: [
        "Dynamic master of ceremonies to guide crowd participation",
        "Curated background and performance sound engineering",
        "Grand celebratory moment with confetti & celebration music",
      ],
    },
    activities: [
      {
        title: "Interactive Memory & Photo Keepsake Studio",
        description:
          "Instant printed photo takeaways and digital sharing station with fun festive props.",
        targetAudience: "All attending guests and families",
      },
      {
        title: "Curated Guestbook / Wishing Board",
        description:
          "Artistic signature canvas where guests leave heartfelt notes and wishes for the hosts.",
        targetAudience: "Friends, elders, and colleagues",
      },
      {
        title: "Icebreaker Games & Spot Giveaways",
        description:
          "Lighthearted customized trivia and fun mini-challenges hosted by the emcee.",
        targetAudience: "Groups of all ages",
      },
    ],
  };
}

export function generateDemoBudgetLines(input: EventFormInput) {
  const B = input.budget;
  const isWedding = input.eventType === "wedding";

  return [
    {
      category: "Venue & Infrastructure",
      item: `Venue booking, basic generator setup, and maintenance in ${input.city}`,
      allocatedAmount: Math.round(B * (isWedding ? 0.3 : 0.25)),
      actualAmount: 0,
      isCheaperAlternativeAvailable: true,
      cheaperAlternativeNote:
        "Opt for non-peak slot or club/community auditorium to save 15-20%.",
      potentialSavings: Math.round(B * 0.05),
    },
    {
      category: "Food, Catering & Beverages",
      item: `Buffet dinner & live counters for ${input.guests} guests (${input.currency}${Math.round((B * 0.35) / Math.max(1, input.guests))}/plate)`,
      allocatedAmount: Math.round(B * 0.35),
      actualAmount: 0,
      isCheaperAlternativeAvailable: true,
      cheaperAlternativeNote:
        "Streamline appetizers from 6 items to 4 items and select seasonal fruit desserts.",
      potentialSavings: Math.round(B * 0.06),
    },
    {
      category: "Decor & Theme Styling",
      item: `Stage backdrop, floral setups, entrance arch (${input.theme || "Festive"})`,
      allocatedAmount: Math.round(B * 0.18),
      actualAmount: 0,
      isCheaperAlternativeAvailable: true,
      cheaperAlternativeNote:
        "Substitute imported blooms with marigold/jasmine or silk textiles.",
      potentialSavings: Math.round(B * 0.04),
    },
    {
      category: "Sound, Lighting & DJ",
      item: "PA system, wireless microphones, LED stage wash, and DJ setup",
      allocatedAmount: Math.round(B * 0.1),
      actualAmount: 0,
      isCheaperAlternativeAvailable: true,
      cheaperAlternativeNote:
        "In-house venue audio package or student/resident DJ talent.",
      potentialSavings: Math.round(B * 0.02),
    },
    {
      category: "Photography & Videography",
      item: "Professional event photographer with highlight reel and edited album",
      allocatedAmount: Math.round(B * 0.07),
      actualAmount: 0,
      isCheaperAlternativeAvailable: false,
      cheaperAlternativeNote:
        "Crucial memory investment; negotiate half-day package.",
      potentialSavings: 0,
    },
    {
      category: "Emergency Buffer & Contingency",
      item: "Spare cables, tips, urgent transport runs, and medical first-aid kit",
      allocatedAmount: Math.round(B * 0.1),
      actualAmount: 0,
      isCheaperAlternativeAvailable: false,
      cheaperAlternativeNote:
        "Vital buffer to prevent last-minute cost overruns.",
      potentialSavings: 0,
    },
  ];
}

export function generateDemoTimeline(input: EventFormInput): {
  tasks: RawTimelineTask[];
  daySchedule: EventDayScheduleItem[];
} {
  const tasks: RawTimelineTask[] = [
    {
      title: "Confirm & Reserve Venue Contract",
      category: "Venue",
      dueOffsetDays: 30,
      priority: "high",
      notes: `Verify wheelchair accessibility and guest parking capacity for ${input.guests} guests.`,
    },
    {
      title: "Finalize Catering Menu & Dietary Safe Zones",
      category: "Catering",
      dueOffsetDays: 21,
      priority: "high",
      notes: `Confirm count for ${input.dietary.join(", ") || "standard"} meals.`,
    },
    {
      title: "Dispatch Digital & WhatsApp Invitations",
      category: "Publicity",
      dueOffsetDays: 15,
      priority: "medium",
      notes: "Include RSVP deadline, Google Maps location pin, and dress code.",
    },
    {
      title: "Book Decorator & Acoustic Audio Setup",
      category: "Production",
      dueOffsetDays: 10,
      priority: "high",
      notes: "Review stage measurements and power supply redundancy.",
    },
    {
      title: "Lock In Headcount & Seating Layout",
      category: "Hospitality",
      dueOffsetDays: 5,
      priority: "medium",
      notes: "Send finalized guest count to the culinary team.",
    },
    {
      title: "Final Vendor Walkthrough & Rehearsal",
      category: "Coordination",
      dueOffsetDays: 1,
      priority: "high",
      notes:
        "Verify microphone batteries, schedule timings, and emergency contact list.",
    },
  ];

  const daySchedule: EventDayScheduleItem[] = [
    {
      id: "sched-d-1",
      time: "02:00 PM - 03:30 PM",
      activity: "Vendor Load-In & Audio Soundcheck",
      owner: "Stage Lead & Audio Engineer",
      notes: "Verify generator backup and lighting cue positions.",
    },
    {
      id: "sched-d-2",
      time: "04:00 PM - 04:30 PM",
      activity: "Host & Volunteer Final Coordination Huddle",
      owner: "Event Planner",
      notes: "Distribute run sheets, walkie-talkies, and welcome gift hampers.",
    },
    {
      id: "sched-d-3",
      time: "05:00 PM - 06:00 PM",
      activity: "Guest Arrival, Welcome Drinks & Photobooth Open",
      owner: "Hospitality Team",
      notes:
        "Live acoustic background music; assist elders with ground floor seating.",
    },
    {
      id: "sched-d-4",
      time: "06:00 PM - 07:45 PM",
      activity: "Main Celebration, Speeches & Performances",
      owner: "Master of Ceremonies",
      notes: "Keep speeches under 5 minutes per speaker; spotlight on hosts.",
    },
    {
      id: "sched-d-5",
      time: "07:45 PM - 09:30 PM",
      activity: "Dinner Buffet Opens & Mingling",
      owner: "Catering Captain",
      notes:
        "Replenish hot chafing dishes continuously; circulate dessert trays.",
    },
    {
      id: "sched-d-6",
      time: "09:30 PM - 10:30 PM",
      activity: "Open Dance Floor, Cake/Mementos & Wrap-up",
      owner: "DJ & Hosts",
      notes: "Final group photo and farewell favor distribution.",
    },
  ];

  return { tasks, daySchedule };
}

export function generateDemoVendors(input: EventFormInput): {
  vendors: RawVendorItem[];
  expertTips: string[];
  weatherPlanB: WeatherPlanB;
} {
  const vendors: RawVendorItem[] = [
    {
      serviceType: "Venue & Banquet Hall",
      estCostRange: `${input.currency}${Math.round(input.budget * 0.25).toLocaleString()} - ${input.currency}${Math.round(input.budget * 0.35).toLocaleString()}`,
      questionsToAsk: [
        "Does the venue rental include air-conditioning and backup power generators?",
        "Are there any corkage fees, outside vendor royalties, or overtime charges past 10 PM?",
        "Is wheelchair accessibility guaranteed from the parking lot to the main stage?",
      ],
    },
    {
      serviceType: "Catering & Dining Hospitality",
      estCostRange: `${input.currency}${Math.round(input.budget * 0.3).toLocaleString()} - ${input.currency}${Math.round(input.budget * 0.4).toLocaleString()}`,
      questionsToAsk: [
        `How do you prevent cross-contamination for ${input.dietary.join(", ") || "special"} dietary requests?`,
        "What is your staff-to-guest ratio for live buffet replenishment?",
        "Are disposable compostable plates included or can premium bone china be hired?",
      ],
    },
    {
      serviceType: "Acoustic Sound & Thematic Lighting",
      estCostRange: `${input.currency}${Math.round(input.budget * 0.08).toLocaleString()} - ${input.currency}${Math.round(input.budget * 0.15).toLocaleString()}`,
      questionsToAsk: [
        "What specific mixer and speaker brands will be deployed on site?",
        "How many wireless microphones and cordless lavaliers are provided?",
        "Do you provide an on-site audio technician who remains through the entire duration?",
      ],
    },
    {
      serviceType: "Event Photography & Film",
      estCostRange: `${input.currency}${Math.round(input.budget * 0.06).toLocaleString()} - ${input.currency}${Math.round(input.budget * 0.12).toLocaleString()}`,
      questionsToAsk: [
        "What is the turnaround time for raw preview photos versus the edited album?",
        "Will there be one traditional photographer and one candid photographer?",
        "Do you shoot 4K video clips optimized for Instagram Reels and WhatsApp sharing?",
      ],
    },
  ];

  const expertTips = [
    `For an event in ${input.city}, secure vendor contracts at least 3-4 weeks in advance to avoid surge pricing.`,
    "Always lock in the final guest count with your caterer 48 hours prior to avoid paying for unexpected no-shows.",
    "Keep an emergency vendor kit ready: double-sided tape, safety pins, phone chargers, pain relievers, and cash for tips.",
    "Assign a trusted family member or co-host as the point person on event day so the primary hosts can actually enjoy the celebration.",
  ];

  const weatherPlanB: WeatherPlanB = {
    riskAssessment: `Unpredictable seasonal rainfall or extreme heat in ${input.city} during outdoor gatherings.`,
    contingencySteps: [
      "Ensure the venue contract includes a complimentary indoor banquet hall holding option.",
      "Contract water-proof marquees or gazebo canopies with side walls ready on a 4-hour alert.",
      "Keep heavy-duty industrial misting fans (summer) or patio heaters (winter) on rental standby.",
    ],
    backupVenuesOrGear: [
      "Indoor Banquet Transition Hall",
      "Waterproof tarpaulins and cable ramps for electrical leads",
      "Emergency golf-umbrella station at the valet drop-off",
    ],
  };

  return { vendors, expertTips, weatherPlanB };
}
