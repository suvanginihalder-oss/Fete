import React from "react";
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ShieldAlert,
  Car,
  Lightbulb,
  FileText,
  Share2,
  Printer,
  RotateCcw,
} from "lucide-react";
import type { HouseholdProfile, PersonalizedPlan } from "../types/index.js";
import {
  loadCheckedTasks,
  saveCheckedTasks,
  encodeProfileShareUrl,
} from "../lib/storage.js";

interface MyPlanViewProps {
  plan: PersonalizedPlan;
  profile: HouseholdProfile;
  onRegenerate: () => void;
  isLoading: boolean;
}

export const MyPlanView: React.FC<MyPlanViewProps> = ({
  plan,
  profile,
  onRegenerate,
  isLoading,
}) => {
  const todayKey = new Date().toISOString().slice(0, 10);
  const [checkedTasks, setCheckedTasks] = React.useState<
    Record<string, boolean>
  >(() => loadCheckedTasks(todayKey));
  const [copied, setCopied] = React.useState(false);

  const toggleTask = (taskName: string) => {
    const updated = { ...checkedTasks, [taskName]: !checkedTasks[taskName] };
    setCheckedTasks(updated);
    saveCheckedTasks(todayKey, updated);
  };

  const handleShare = () => {
    const url = encodeProfileShareUrl(profile);
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const routineCategories = [
    { label: "Morning Smog Defence", items: plan.lowEmissionRoutine.morning },
    {
      label: "Commute & Travel Protection",
      items: plan.lowEmissionRoutine.commute,
    },
    {
      label: "Evening Clean Air Recovery",
      items: plan.lowEmissionRoutine.evening,
    },
  ];

  return (
    <div className="space-y-6 mt-6">
      {/* Plan Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-300">
              <Sparkles
                className="w-4 h-4 text-emerald-300"
                aria-hidden="true"
              />
              <span>Personalized Smog Defence Plan</span>
              {plan.fallbackUsed && (
                <span className="bg-amber-500 text-slate-900 text-[10px] px-2 py-0.5 rounded font-bold">
                  Baseline Offline Engine
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 text-white">
              {plan.headline}
            </h2>
            <p className="text-emerald-100 text-sm mt-2 max-w-3xl leading-relaxed">
              {plan.todayRiskSummary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-xs font-bold text-white transition-colors focus:ring-2 focus:ring-white focus:outline-none"
              aria-label="Share read-only link for this profile"
            >
              <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{copied ? "Link Copied!" : "Share Plan"}</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-xs font-bold text-white transition-colors focus:ring-2 focus:ring-white focus:outline-none"
              aria-label="Print or save as PDF"
            >
              <Printer className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Print / PDF</span>
            </button>
            <button
              onClick={onRegenerate}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold transition-colors disabled:opacity-60 focus:ring-2 focus:ring-emerald-300 focus:outline-none"
              aria-label="Refresh advice plan"
            >
              <RotateCcw
                className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
                aria-hidden="true"
              />
              <span>Refresh Advice</span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-emerald-700/60 text-xs text-emerald-200 flex flex-wrap items-center justify-between gap-2">
          <span>{plan.generationNotice}</span>
          <span className="font-semibold text-amber-200">
            General guidance, not medical advice.
          </span>
        </div>
      </div>

      {/* Household Risk by Member Category */}
      {plan.memberRisks && plan.memberRisks.length > 0 && (
        <section
          aria-labelledby="member-risks-heading"
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
        >
          <h3
            id="member-risks-heading"
            className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4"
          >
            <ShieldAlert
              className="w-5 h-5 text-amber-600"
              aria-hidden="true"
            />
            Vulnerability Breakdown by Household Member
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plan.memberRisks.map((mr, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-800">
                      {mr.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        mr.riskLevel === "Critical"
                          ? "bg-rose-100 text-rose-800"
                          : mr.riskLevel === "High"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {mr.riskLevel} Risk
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {mr.action}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Low-Emission Action Routine (Tickable Tasks) */}
      <section
        aria-labelledby="routine-heading"
        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            id="routine-heading"
            className="text-base font-bold text-slate-800 flex items-center gap-2"
          >
            <FileText className="w-5 h-5 text-emerald-600" aria-hidden="true" />
            Today's Low-Emission Routine (Interactive Checklist)
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            {Object.values(checkedTasks).filter(Boolean).length} completed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {routineCategories.map((cat, cIdx) => (
            <div key={cIdx} className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
                {cat.label}
              </h4>
              <div className="space-y-2">
                {cat.items.map((item, iIdx) => {
                  const taskKey = `${cat.label}_${iIdx}`;
                  const isChecked = !!checkedTasks[taskKey];
                  return (
                    <button
                      key={iIdx}
                      type="button"
                      onClick={() => toggleTask(taskKey)}
                      className={`w-full text-left p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-colors focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                        isChecked
                          ? "bg-emerald-50/60 border-emerald-300 text-emerald-900 line-through opacity-75"
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                      }`}
                    >
                      {isChecked ? (
                        <CheckCircle2
                          className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle
                          className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                      )}
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Indoor Air Hacks */}
      <section
        aria-labelledby="indoor-hacks-heading"
        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
      >
        <h3
          id="indoor-hacks-heading"
          className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4"
        >
          <Lightbulb className="w-5 h-5 text-amber-500" aria-hidden="true" />
          Practical Indoor Air Hacks & Science Facts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plan.indoorAirHacks.map((hack, hIdx) => (
            <div
              key={hIdx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                  <span>{hack.title}</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    {hack.costEstimate}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  {hack.description}
                </p>
              </div>
              <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Category: {hack.category}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sustainable Commute Swap */}
      {plan.sustainableCommuteSwap && (
        <section
          aria-labelledby="commute-swap-heading"
          className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 shadow-sm"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Car
                className="w-6 h-6 text-emerald-700 flex-shrink-0 mt-1"
                aria-hidden="true"
              />
              <div>
                <h3
                  id="commute-swap-heading"
                  className="text-base font-bold text-emerald-950"
                >
                  Sustainable Commute Swap:{" "}
                  {plan.sustainableCommuteSwap.suggestedMode}
                </h3>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed max-w-2xl">
                  {plan.sustainableCommuteSwap.explanation}
                </p>
              </div>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 text-center flex-shrink-0 w-full md:w-auto">
              <div className="text-[10px] text-slate-500 uppercase tracking-wide font-bold">
                Estimated CO2 Saved
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-0.5">
                ~{plan.sustainableCommuteSwap.monthlyCo2SavedKg} kg
              </div>
              <div className="text-[10px] text-slate-400">
                per month (modelled estimate)
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Why This Matters Explainer */}
      <div className="p-4 rounded-xl bg-slate-100 text-slate-700 text-xs border border-slate-200 leading-relaxed">
        <strong>Why this matters:</strong> {plan.whyThisMatters}
      </div>
    </div>
  );
};
