export type EventType =
  "wedding" | "birthday" | "anniversary" | "college_fest" | "community";

export interface EventFormInput {
  eventType: EventType;
  name: string;
  date: string; // YYYY-MM-DD
  city: string;
  guests: number;
  budget: number;
  currency: string; // default '₹'
  theme: string;
  dietary: string[];
  accessibility: string[];
  culturalPreferences: string;
  specialRequests: string;
}

export interface DecorIdea {
  title: string;
  description: string;
  estCostSharePercent: number;
  items: string[];
}

export interface CulinaryConcept {
  title: string;
  description: string;
  highlights: string[];
  dietaryAccommodations: string;
}

export interface EntertainmentConcept {
  title: string;
  description: string;
  scheduleSuggestion: string;
  highlights: string[];
}

export interface ActivityIdea {
  title: string;
  description: string;
  targetAudience: string;
}

export interface ConceptData {
  tagline: string;
  decor: DecorIdea[];
  food: CulinaryConcept;
  entertainment: EntertainmentConcept;
  activities: ActivityIdea[];
}

export interface BudgetLine {
  id: string;
  category: string;
  item: string;
  allocatedAmount: number;
  actualAmount: number;
  percentage: number;
  isCheaperAlternativeAvailable: boolean;
  cheaperAlternativeNote: string;
  potentialSavings: number;
}

export interface BudgetSummary {
  totalBudget: number;
  lines: BudgetLine[];
  totalAllocated: number;
  totalActual: number;
  remainingBudget: number;
  isOverBudget: boolean;
  overBudgetAmount: number;
  warnings: string[];
}

export type TaskPriority = "high" | "medium" | "low";

export interface RawTimelineTask {
  title: string;
  category: string;
  dueOffsetDays: number; // days before the event
  priority: TaskPriority;
  notes?: string;
}

export interface TimelineTask extends RawTimelineTask {
  id: string;
  targetDate: string; // YYYY-MM-DD computed
  completed: boolean;
  isOverdue: boolean;
  isCompressed?: boolean;
}

export interface EventDayScheduleItem {
  id: string;
  time: string;
  activity: string;
  owner: string;
  notes: string;
}

export type VendorStatus = "not_contacted" | "shortlisted" | "booked";

export interface RawVendorItem {
  serviceType: string;
  estCostRange: string;
  questionsToAsk: string[];
}

export interface VendorItem extends RawVendorItem {
  id: string;
  status: VendorStatus;
  bookedCost?: number;
  contactName?: string;
  notes?: string;
}

export interface WeatherPlanB {
  riskAssessment: string;
  contingencySteps: string[];
  backupVenuesOrGear: string[];
}

export interface GuestItem {
  id: string;
  name: string;
  emailOrPhone: string;
  status: "confirmed" | "pending" | "declined";
  dietaryNote: string;
  plusOnes: number;
}

export interface EventPlan {
  id: string;
  createdAt: string;
  updatedAt: string;
  isDemoMode: boolean;
  demoBannerMessage?: string;
  input: EventFormInput;
  concept: ConceptData;
  budget: BudgetSummary;
  timeline: TimelineTask[];
  daySchedule: EventDayScheduleItem[];
  vendors: VendorItem[];
  expertTips: string[];
  weatherPlanB: WeatherPlanB;
  guests: GuestItem[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  timestamp: string;
  content: string;
  suggestedAction?: {
    type: "modify_budget" | "add_task" | "update_concept" | "general";
    label: string;
    diffSummary: string;
    applyPayload: any;
  };
}

export type SectionKey = "concept" | "budget" | "timeline" | "vendors";

export interface SectionStatus {
  loading: boolean;
  error?: string;
  retrying: boolean;
  completed: boolean;
}
