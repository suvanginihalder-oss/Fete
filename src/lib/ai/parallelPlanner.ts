import { EventFormInput, SectionKey, EventPlan, BudgetSummary, TimelineTask, EventDayScheduleItem, VendorItem, WeatherPlanB, ConceptData } from '../../types';
import { callSectionAI, generateLocalSectionData } from './providerAdapter';
import { rescaleBudgetLines, computeTimelineDates } from '../math';

export interface ParallelPlanCallbacks {
  onSectionStart: (section: SectionKey) => void;
  onSectionSuccess: (section: SectionKey, data: any, isDemo: boolean) => void;
  onSectionError: (section: SectionKey, error: string) => void;
}

export async function fetchSectionWithSingleRetry<T>(
  section: SectionKey,
  input: EventFormInput,
  callbacks: ParallelPlanCallbacks
): Promise<{ data: T; isDemo: boolean }> {
  callbacks.onSectionStart(section);

  try {
    const result = await callSectionAI<T>(section, input);
    callbacks.onSectionSuccess(section, result.data, result.isDemo);
    return result;
  } catch (err: any) {
    // Retry once automatically
    try {
      const retryResult = await callSectionAI<T>(section, input);
      callbacks.onSectionSuccess(section, retryResult.data, retryResult.isDemo);
      return retryResult;
    } catch (retryErr: any) {
      // Fallback to safe local generator rather than showing broken state
      const fallbackData = generateLocalSectionData(section, input);
      callbacks.onSectionSuccess(section, fallbackData, true);
      return { data: fallbackData as T, isDemo: true };
    }
  }
}

export async function generateFullParallelPlan(
  input: EventFormInput,
  callbacks: ParallelPlanCallbacks
): Promise<EventPlan> {
  let isAnyDemo = false;

  // Execute all 4 sections in parallel
  const [conceptRes, budgetRes, timelineRes, vendorRes] = await Promise.all([
    fetchSectionWithSingleRetry<ConceptData>('concept', input, callbacks),
    fetchSectionWithSingleRetry<{ lines: any[] }>('budget', input, callbacks),
    fetchSectionWithSingleRetry<{ tasks: any[]; daySchedule: any[] }>('timeline', input, callbacks),
    fetchSectionWithSingleRetry<{ vendors: any[]; expertTips: string[]; weatherPlanB: WeatherPlanB }>('vendors', input, callbacks),
  ]);

  if (conceptRes.isDemo || budgetRes.isDemo || timelineRes.isDemo || vendorRes.isDemo) {
    isAnyDemo = true;
  }

  // Code owns the math
  const budgetSummary: BudgetSummary = rescaleBudgetLines(budgetRes.data.lines, input.budget);
  const timelineTasks: TimelineTask[] = computeTimelineDates(timelineRes.data.tasks, input.date);

  const daySchedule: EventDayScheduleItem[] = (timelineRes.data.daySchedule || []).map((item: any, idx: number) => ({
    id: item.id || `sched-${idx}-${Date.now()}`,
    time: item.time || '10:00 AM',
    activity: item.activity || 'Activity',
    owner: item.owner || 'Host',
    notes: item.notes || '',
  }));

  const vendors: VendorItem[] = (vendorRes.data.vendors || []).map((v: any, idx: number) => ({
    id: `v-${idx}-${Date.now()}`,
    serviceType: v.serviceType || 'Vendor Service',
    estCostRange: v.estCostRange || 'Price on request',
    questionsToAsk: v.questionsToAsk || [],
    status: 'not_contacted' as const,
  }));

  const planId = `plan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  return {
    id: planId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDemoMode: isAnyDemo,
    demoBannerMessage: isAnyDemo ? 'Sample plan, not live AI (Protected by Demo Safety Mode)' : undefined,
    input,
    concept: conceptRes.data,
    budget: budgetSummary,
    timeline: timelineTasks,
    daySchedule,
    vendors,
    expertTips: vendorRes.data.expertTips || [],
    weatherPlanB: vendorRes.data.weatherPlanB || {
      riskAssessment: 'Standard seasonal weather risks assessed.',
      contingencySteps: ['Prepare indoor transition plan.', 'Have water-proof covers ready.'],
      backupVenuesOrGear: ['Indoor banquet space', 'Tarpaulins'],
    },
    guests: [
      { id: 'g-init-1', name: 'Primary Host', emailOrPhone: 'host@celebr.ai', status: 'confirmed', dietaryNote: input.dietary[0] || '', plusOnes: 1 },
      { id: 'g-init-2', name: 'Key Guest / Co-organizer', emailOrPhone: 'guest@celebr.ai', status: 'confirmed', dietaryNote: '', plusOnes: 0 },
    ],
  };
}
