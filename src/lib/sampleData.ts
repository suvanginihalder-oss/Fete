import { EventPlan, EventFormInput } from '../types';
import { rescaleBudgetLines, computeTimelineDates } from './math';

export function getSampleEventDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function createSampleCollegeFest(): EventPlan {
  const eventDate = getSampleEventDate();

  const input: EventFormInput = {
    eventType: 'college_fest',
    name: "Aura '26: Inter-College Cultural & Arts Fest",
    date: eventDate,
    city: 'Bengaluru',
    guests: 250,
    budget: 50000,
    currency: '₹',
    theme: 'Retro Neon Waves & Indie Fusion',
    dietary: ['Pure Veg', 'Jain Option', 'Gluten-Free'],
    accessibility: ['Wheelchair Ramps', 'Quiet Space / Sensory Friendly', 'Ground Floor Access'],
    culturalPreferences: 'Youth collegiate fest: Battle of the bands, street play (Nukkad Natak), classical fusion & DJ night',
    specialRequests: 'Acoustic stage coverage, student volunteer coordination, noise curfew adherence at 10:00 PM',
  };

  const rawBudgetLines = [
    {
      category: 'Sound & Lighting',
      item: 'PA System, 32-Channel Mixer, Stage Wash & Par Lights',
      allocatedAmount: 18000,
      actualAmount: 17500,
      isCheaperAlternativeAvailable: true,
      cheaperAlternativeNote: 'Partner with campus audio club gear; rent only subwoofers and monitors to save ₹5,000.',
      potentialSavings: 5000,
    },
    {
      category: 'Stage & Neon Decor',
      item: 'Eco-friendly cardboard neon backdrop, glow tape, LED fairy ropes',
      allocatedAmount: 9000,
      actualAmount: 8200,
      isCheaperAlternativeAvailable: true,
      cheaperAlternativeNote: 'Fine Arts student guild fabrication instead of commercial event agency.',
      potentialSavings: 3000,
    },
    {
      category: 'Food & Refreshments',
      item: 'High-energy snack boxes, samosa chaat, iced coolers, refillable water cans',
      allocatedAmount: 12000,
      actualAmount: 12000,
      isCheaperAlternativeAvailable: false,
      cheaperAlternativeNote: 'Local college cafeteria concession deal is already heavily discounted.',
      potentialSavings: 0,
    },
    {
      category: 'Guest Artist & Emcee',
      item: 'Indie Band Honorarium, travel allowance, hospitality basket',
      allocatedAmount: 6000,
      actualAmount: 6500,
      isCheaperAlternativeAvailable: true,
      cheaperAlternativeNote: 'Alumni musician guest performance with campus travel sponsorship.',
      potentialSavings: 2000,
    },
    {
      category: 'Marketing & Badges',
      item: 'Recycled lanyard passes, wristbands, campus posters, digital flyers',
      allocatedAmount: 2500,
      actualAmount: 2300,
      isCheaperAlternativeAvailable: true,
      cheaperAlternativeNote: 'QR-code digital entry passes via phone instead of plastic badges.',
      potentialSavings: 1200,
    },
    {
      category: 'Emergency Buffer',
      item: 'Contingency fund, spare extension cords, first aid station',
      allocatedAmount: 2500,
      actualAmount: 800,
      isCheaperAlternativeAvailable: false,
      cheaperAlternativeNote: 'Non-negotiable campus safety reserve.',
      potentialSavings: 0,
    },
  ];

  const budgetSummary = rescaleBudgetLines(rawBudgetLines, 50000);

  const rawTimelineTasks = [
    {
      title: 'Finalize Auditorium & Open-Air Quad Permission',
      category: 'Logistics',
      dueOffsetDays: 28,
      priority: 'high' as const,
      notes: 'Submit fire safety and dean office clearance forms.',
    },
    {
      title: 'Sound & Audio Vendor Contract Sign-off',
      category: 'Production',
      dueOffsetDays: 21,
      priority: 'high' as const,
      notes: 'Test acoustic reverberation in quad; inspect 3-phase power generator.',
    },
    {
      title: 'Inter-College Invitations & Team Registration Launch',
      category: 'Publicity',
      dueOffsetDays: 16,
      priority: 'medium' as const,
      notes: 'Circulate Google Form across 25 Bengaluru engineering and degree colleges.',
    },
    {
      title: 'Catering Taste Test & Dietary Segregation Plan',
      category: 'Hospitality',
      dueOffsetDays: 10,
      priority: 'medium' as const,
      notes: 'Designate separate counter for pure veg & Jain meal tokens.',
    },
    {
      title: 'Volunteer Briefing & Safety Drill Walkthrough',
      category: 'Coordination',
      dueOffsetDays: 4,
      priority: 'high' as const,
      notes: 'Assign 18 student marshals to crowd flow, green rooms, and accessibility ramps.',
    },
    {
      title: 'Final Stage Sound Check & Lighting Run-through',
      category: 'Production',
      dueOffsetDays: 1,
      priority: 'high' as const,
      notes: 'Lock in mic frequencies, backup cordless batteries, and playlist cues.',
    },
  ];

  const timeline = computeTimelineDates(rawTimelineTasks, eventDate);

  const daySchedule = [
    {
      id: 'sched-1',
      time: '09:00 AM - 10:00 AM',
      activity: 'Participant Registration & Badge Distribution',
      owner: 'Student Hospitality Desk',
      notes: 'Ensure separate queue for wheelchair accessible entry and QR scanner lanes.',
    },
    {
      id: 'sched-2',
      time: '10:00 AM - 11:30 AM',
      activity: 'Inaugural Ceremony & Classical Fusion Ensemble',
      owner: 'Cultural Secretary',
      notes: 'Welcome address by Principal; lamp lighting with acoustic drone background.',
    },
    {
      id: 'sched-3',
      time: '11:45 AM - 01:30 PM',
      activity: 'Street Play & Theatre Drama Showcase (Nukkad Natak)',
      owner: 'Dramatics Society Lead',
      notes: 'Outdoor amphitheatre stage; ensure wireless collar mics are recharged.',
    },
    {
      id: 'sched-4',
      time: '01:30 PM - 02:45 PM',
      activity: 'Buffet Lunch & Chill Acoustic Courtyard Session',
      owner: 'Catering Liaison',
      notes: 'Monitor compostable plate disposal and Jain meal counter replenish rate.',
    },
    {
      id: 'sched-5',
      time: '03:00 PM - 06:00 PM',
      activity: 'Western & Eastern Battle of the Bands Finals',
      owner: 'Music Guild Coordinators',
      notes: 'Strict 12-minute set changeover time; judges scoring tablet sync.',
    },
    {
      id: 'sched-6',
      time: '06:15 PM - 07:30 PM',
      activity: 'Prize Distribution & Trophy Handover',
      owner: 'Dean of Student Affairs',
      notes: 'Certificates pre-sorted by college code; guest mementos ready.',
    },
    {
      id: 'sched-7',
      time: '07:30 PM - 09:45 PM',
      activity: 'Headliner DJ & Indie Pop Concert',
      owner: 'Event Core Committee',
      notes: 'Noise meter monitoring (<75 dB at perimeter); prompt shutdown at 09:45 PM.',
    },
  ];

  const vendors = [
    {
      id: 'v-1',
      serviceType: 'Audio & Live Sound Reinforcement',
      estCostRange: '₹15,000 - ₹20,000',
      questionsToAsk: [
        'Does the package include dynamic snare mics and active stage monitors?',
        'What is your fallback if a channel blows or power surges occur?',
        'Are backup XLR cables and DI boxes provided at no extra charge?'
      ],
      status: 'booked' as const,
      bookedCost: 17500,
      contactName: 'SonicBeat Sound Systems, Koramangala',
      notes: 'Advance of ₹5,000 paid; remainder due on event day after sound check.',
    },
    {
      id: 'v-2',
      serviceType: 'Campus Catering & Refreshment Boxes',
      estCostRange: '₹10,000 - ₹14,000',
      questionsToAsk: [
        'Can you provide live refillable hot chai/coffee urns between 3 PM and 5 PM?',
        'Are Jain and gluten-free snack boxes packaged and sealed with distinct color labels?',
        'Will your crew bring biodegradable dustbins and trash bags?'
      ],
      status: 'booked' as const,
      bookedCost: 12000,
      contactName: 'Annapurna Campus Catering Services',
      notes: 'Menu finalized: Poha, samosa, fruit salad, mint cooler, and filter coffee.',
    },
    {
      id: 'v-3',
      serviceType: 'Stage Canopy & Weather-proof Truss',
      estCostRange: '₹7,000 - ₹10,000',
      questionsToAsk: [
        'Can the canopy withstand sudden 30 km/h wind gusts?',
        'Does the tarp have gutter channels to divert rainwater away from electrical racks?'
      ],
      status: 'shortlisted' as const,
      contactName: 'Bengaluru Tent & Truss Works',
      notes: 'Negotiating down from ₹10,000 to ₹8,200 for 1-day setup.',
    },
  ];

  const guests = [
    { id: 'g-1', name: 'Dr. Meera Swaminathan', emailOrPhone: 'principal@campus.edu', status: 'confirmed' as const, dietaryNote: 'Pure Veg', plusOnes: 1 },
    { id: 'g-2', name: 'Rohan Deshmukh (Lead Guitarist)', emailOrPhone: 'rohan.d@musicguild.org', status: 'confirmed' as const, dietaryNote: 'Jain Option', plusOnes: 3 },
    { id: 'g-3', name: 'Priya Nambiar (Dance Troupe Captain)', emailOrPhone: 'priya.n@dancecrew.in', status: 'confirmed' as const, dietaryNote: 'Pure Veg', plusOnes: 6 },
    { id: 'g-4', name: 'Vikram Joshi (Alumni Judge)', emailOrPhone: 'vikram.j@alumni.net', status: 'confirmed' as const, dietaryNote: 'Gluten-Free', plusOnes: 0 },
    { id: 'g-5', name: 'Shruti Hegde (Dramatics Lead)', emailOrPhone: 'shruti@theatre.in', status: 'pending' as const, dietaryNote: 'Pure Veg', plusOnes: 4 },
    { id: 'g-6', name: 'Karthik Rao (Audio Engineer)', emailOrPhone: 'karthik@sonicbeat.com', status: 'confirmed' as const, dietaryNote: '', plusOnes: 1 },
  ];

  return {
    id: 'sample-college-fest-aura-26',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemoMode: true,
    demoBannerMessage: 'Loaded sample event: Aura \'26 College Cultural Fest (Zero API call used)',
    input,
    concept: {
      tagline: 'Where Indie Vibrations Meet Collegiate Spark: 250 Minds, Infinite Creativity',
      decor: [
        {
          title: 'Cyber-Indie Stage Backdrop',
          description: 'Recycled cardboard modular geometry framed with neon EL wire glow and warm amber flood wash.',
          estCostSharePercent: 18,
          items: ['Modular cardboard geometric pyramids', 'Color-shifting LED strips', 'UV Blacklights for glow posters'],
        },
        {
          title: 'Acoustic Quad Garden Canopy',
          description: 'Hanging paper lanterns, fairy light canopies under gulmohar trees, and rustic wooden seating crates.',
          estCostSharePercent: 10,
          items: ['Biodegradable paper lanterns', 'Warm filament string lamps', 'Campus bench fabric wraps'],
        },
      ],
      food: {
        title: 'Street Fuel & Collegiate Comfort Treats',
        description: 'Vibrant quick-serve finger foods designed for moving between stages without slowing the fest tempo down.',
        highlights: ['Crispy Samosa Chaat with sweet tamarind & mint chutney', 'Spiced Paneer Tikka Wraps', 'Chilled Fresh Kokum & Lemon Coolers', 'Filter Coffee Refill Bar'],
        dietaryAccommodations: 'Dedicated Jain-safe station (no root vegetables, garlic, or onion) and celiac-safe gluten-free snack trays.',
      },
      entertainment: {
        title: 'Eclectic 3-Tier Lineup',
        description: 'Transitioning from daytime classical acoustic showcase to high-decibel evening rock band battle and sunset DJ.',
        scheduleSuggestion: 'Acoustic sets in morning quad -> Stage battle in afternoon -> DJ finale at sunset',
        highlights: ['Fusion Nadhaswaram + Electric Guitar Battle', 'Inter-College 8-Band Showcase', 'Sunset Sunset Synthwave DJ Set'],
      },
      activities: [
        {
          title: 'Neon Graffiti Canvas Wall',
          description: 'Large chalkboard and canvas where attendees leave glow-in-the-dark signatures and doodles.',
          targetAudience: 'All attendees & creators',
        },
        {
          title: 'Open Mic Pop-up Corner',
          description: '10-minute impromptu acoustic slam poetry and standup comedy corner during lunch intervals.',
          targetAudience: 'Student poets, comics & musicians',
        },
        {
          title: 'Instant Polaroid Photo Booth',
          description: 'Retro Polaroid photo frame with fun props, festival mascot cutouts, and physical photo takeaways.',
          targetAudience: 'Squads and visiting college teams',
        },
      ],
    },
    budget: budgetSummary,
    timeline,
    daySchedule,
    vendors,
    expertTips: [
      'Lock in municipal sound permissions at least 14 days prior to avoid abrupt police disruption.',
      'Assign two dedicated runner volunteers equipped with walkie-talkies to the backstage green rooms.',
      'Always keep a secondary 50-meter heavy-gauge power extension reel near the main mixer board.',
      'Collect dietary token counts 48 hours prior so the caterer does not waste food or under-prepare Jain servings.',
    ],
    weatherPlanB: {
      riskAssessment: 'Afternoon thunderstorms or sudden monsoon downpours are common in Bengaluru during transition months.',
      contingencySteps: [
        'Relocate electric instrument racks into covered quad corridor within 7 minutes if raindrops start.',
        'Shift remaining acoustic sets directly to the indoor Main Seminar Hall (300 seat capacity).',
        'Have tarpaulin sheets pre-tacked to rear stage trussing ready to drop down over PA gear immediately.',
      ],
      backupVenuesOrGear: [
        'Campus Indoor Auditorium (Pre-booked as zero-cost standby backup)',
        '3x heavy waterproof tarps (8x10m)',
        'Rubber cable ramp protectors to avoid slipping hazards',
      ],
    },
    guests,
  };
}
