import React from 'react';
import { Sparkles, CheckCircle2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { SectionKey, SectionStatus } from '../types';

interface PlanProgressModalProps {
  isOpen: boolean;
  eventName: string;
  sectionStates: Record<SectionKey, SectionStatus>;
  onRetrySection: (section: SectionKey) => void;
}

const SECTION_CONFIG: Record<SectionKey, { title: string; subtitle: string; icon: string }> = {
  concept: {
    title: 'Section A: Concept & Vibe',
    subtitle: 'Crafting decor theme, menu highlights, and crowd activities',
    icon: '✨',
  },
  budget: {
    title: 'Section B: Budget Allocation & Savings',
    subtitle: 'Generating categories, cheaper alternatives, and code-owned math',
    icon: '💰',
  },
  timeline: {
    title: 'Section C: Timeline & Day Schedule',
    subtitle: 'Calculating real dates, compressing intervals, and minute-by-minute plan',
    icon: '📅',
  },
  vendors: {
    title: 'Section D: Vendors & Contingencies',
    subtitle: 'Estimating cost ranges, negotiation questions, and weather Plan B',
    icon: '🛡️',
  },
};

export const PlanProgressModal: React.FC<PlanProgressModalProps> = ({
  isOpen,
  eventName,
  sectionStates,
  onRetrySection,
}) => {
  if (!isOpen) return null;

  const sections: SectionKey[] = ['concept', 'budget', 'timeline', 'vendors'];
  const completedCount = sections.filter((s) => sectionStates[s]?.completed).length;
  const progressPercent = Math.round((completedCount / sections.length) * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-ivory-300 p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-plum-900 to-coral-600 text-white shadow-soft">
            <Sparkles className="w-6 h-6 animate-pulse text-coral-200" />
          </div>
          <h2 className="font-serif font-bold text-2xl text-plum-950">
            Architecting Your Event
          </h2>
          <p className="text-xs text-stone-700">
            Running 4 parallel section calls for <span className="font-semibold text-plum-900">"{eventName}"</span>
          </p>
        </div>

        {/* Global Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-stone-700 mb-1.5">
            <span>Synthesis Progress</span>
            <span className="text-coral-600 font-bold">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-ivory-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-plum-900 to-coral-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 4 Section Skeletons / States */}
        <div className="space-y-3">
          {sections.map((key) => {
            const st = sectionStates[key] || { loading: true, completed: false };
            const cfg = SECTION_CONFIG[key];

            return (
              <div
                key={key}
                className={`p-3.5 rounded-2xl border transition-all ${
                  st.completed
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : st.error
                    ? 'bg-rose-50/60 border-rose-200'
                    : 'bg-ivory-100/80 border-ivory-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{cfg.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-plum-950">{cfg.title}</p>
                      <p className="text-[11px] text-stone-700">{cfg.subtitle}</p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {st.completed ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="hidden sm:inline">Ready</span>
                      </span>
                    ) : st.error ? (
                      <button
                        onClick={() => onRetrySection(key)}
                        type="button"
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-800 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-plum-800 font-medium">
                        <Loader2 className="w-4 h-4 animate-spin text-coral-600" />
                        <span className="hidden sm:inline">Generating...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inline error notice if section failed */}
                {st.error && (
                  <p className="text-[11px] text-rose-700 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>{st.error}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[11px] text-center text-stone-700">
          Timeout safeguards active. If network restricts live AI, local sample data is safely loaded without crashing.
        </p>
      </div>
    </div>
  );
};
