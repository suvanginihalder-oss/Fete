import { z } from 'zod';

export const eventFormSchema = z.object({
  eventType: z.enum(['wedding', 'birthday', 'anniversary', 'college_fest', 'community'], {
    errorMap: () => ({ message: 'Please select a valid event type' }),
  }),
  name: z.string().trim().min(3, 'Event name must be at least 3 characters').max(80, 'Event name must be 80 characters or less'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').refine((val) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eventDate = new Date(val);
    return !isNaN(eventDate.getTime()) && eventDate >= today;
  }, { message: 'Event date must be in the future (or today)' }),
  city: z.string().trim().min(2, 'City is required').max(50, 'City name is too long'),
  guests: z.number().int().min(1, 'At least 1 guest required').max(200000, 'Guest count exceeds maximum'),
  budget: z.number().int().min(500, 'Budget must be at least 500').max(1000000000, 'Budget exceeds allowed limit'),
  currency: z.string().default('₹'),
  theme: z.string().trim().max(120, 'Theme must be 120 characters or less').default('Festive Elegance'),
  dietary: z.array(z.string()).default([]),
  accessibility: z.array(z.string()).default([]),
  culturalPreferences: z.string().trim().max(250, 'Cultural preferences text too long').default(''),
  specialRequests: z.string().trim().max(500, 'Special requests text too long').default(''),
});

export const decorIdeaSchema = z.object({
  title: z.string().min(2),
  description: z.string(),
  estCostSharePercent: z.number().min(0).max(100),
  items: z.array(z.string()),
});

export const culinaryConceptSchema = z.object({
  title: z.string().min(2),
  description: z.string(),
  highlights: z.array(z.string()),
  dietaryAccommodations: z.string(),
});

export const entertainmentConceptSchema = z.object({
  title: z.string().min(2),
  description: z.string(),
  scheduleSuggestion: z.string(),
  highlights: z.array(z.string()),
});

export const activityIdeaSchema = z.object({
  title: z.string().min(2),
  description: z.string(),
  targetAudience: z.string(),
});

export const conceptDataSchema = z.object({
  tagline: z.string().min(5),
  decor: z.array(decorIdeaSchema).min(1),
  food: culinaryConceptSchema,
  entertainment: entertainmentConceptSchema,
  activities: z.array(activityIdeaSchema).min(1),
});

export const rawBudgetLineSchema = z.object({
  category: z.string(),
  item: z.string(),
  allocatedAmount: z.number().min(0),
  actualAmount: z.number().optional().default(0),
  percentage: z.number().min(0).max(100).optional(),
  isCheaperAlternativeAvailable: z.boolean().optional().default(false),
  cheaperAlternativeNote: z.string().optional().default(''),
  potentialSavings: z.number().optional().default(0),
});

export const budgetSectionSchema = z.object({
  lines: z.array(rawBudgetLineSchema).min(3),
});

export const rawTimelineTaskSchema = z.object({
  title: z.string().min(2),
  category: z.string(),
  dueOffsetDays: z.number().int().min(0), // days before event
  priority: z.enum(['high', 'medium', 'low']),
  notes: z.string().optional(),
});

export const dayScheduleItemSchema = z.object({
  time: z.string(),
  activity: z.string(),
  owner: z.string(),
  notes: z.string().default(''),
});

export const timelineSectionSchema = z.object({
  tasks: z.array(rawTimelineTaskSchema).min(3),
  daySchedule: z.array(dayScheduleItemSchema).min(3),
});

export const rawVendorItemSchema = z.object({
  serviceType: z.string(),
  estCostRange: z.string(),
  questionsToAsk: z.array(z.string()),
});

export const weatherPlanBSchema = z.object({
  riskAssessment: z.string(),
  contingencySteps: z.array(z.string()),
  backupVenuesOrGear: z.array(z.string()),
});

export const vendorSectionSchema = z.object({
  vendors: z.array(rawVendorItemSchema).min(2),
  expertTips: z.array(z.string()).min(2),
  weatherPlanB: weatherPlanBSchema,
});

