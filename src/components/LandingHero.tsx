import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Cpu, Sliders, Users, CalendarCheck, Share2 } from 'lucide-react';
import { EventType } from '../types';

interface LandingHeroProps {
  onStartNew: (type?: EventType) => void;
  onLoadSample: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onStartNew, onLoadSample }) => {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-plum-100/80 border border-plum-200 text-plum-900 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-coral-600" />
          <span>Zero Serverless Timeouts • 4 Parallel Section Calls • Code-Owned Math</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-plum-950 tracking-tight leading-tight mb-6">
          Effortless Celebration, <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-plum-900 via-coral-600 to-plum-700 bg-clip-text text-transparent">
            Powered by Parallel AI
          </span>
        </h1>

        <p className="text-base sm:text-lg text-stone-700 leading-relaxed mb-8">
          CelebrAI crafts comprehensive event blueprints for weddings, birthdays, anniversaries,
          college fests, and community gatherings. Fast progressive generation, code-rescaled budgets,
          over-budget safeguards, interactive what-if sliders, and zero-backend URL sharing.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={onLoadSample}
            type="button"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-plum-900 via-plum-800 to-coral-700 hover:from-plum-950 hover:to-coral-800 shadow-elevated transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Sparkles className="w-4 h-4 text-coral-200" />
            <span>Load College Fest Sample (Demo)</span>
            <ArrowRight className="w-4 h-4 text-coral-300 ml-1" />
          </button>

          <button
            onClick={() => onStartNew()}
            type="button"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-plum-900 bg-white hover:bg-ivory-200 border border-ivory-400 shadow-soft transition-colors"
          >
            <span>Plan Custom Event</span>
          </button>
        </div>

        {/* Demo Safety Guarantee badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-stone-700">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Demo Safety Guaranteed: Always loads smoothly with zero flaky API dependency</span>
        </div>
      </div>

      {/* Feature Pills */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
        <div className="p-5 rounded-2xl bg-white/80 border border-ivory-300 shadow-soft">
          <div className="w-10 h-10 rounded-xl bg-plum-100 flex items-center justify-center text-plum-900 mb-3">
            <Cpu className="w-5 h-5 text-plum-800" />
          </div>
          <h2 className="font-semibold text-plum-950 mb-1 text-base">4 Parallel Section Calls</h2>
          <p className="text-xs text-stone-700 leading-relaxed">
            Eliminates serverless timeouts. Concept, budget, timeline, and vendors load concurrently with skeletons.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 border border-ivory-300 shadow-soft">
          <div className="w-10 h-10 rounded-xl bg-coral-100 flex items-center justify-center text-coral-700 mb-3">
            <Sliders className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-plum-950 mb-1 text-base">Code Owns The Math</h2>
          <p className="text-xs text-stone-700 leading-relaxed">
            Rescales budget lines to sum exactly to the penny. What-if slider updates instantly without AI calls.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 border border-ivory-300 shadow-soft">
          <div className="w-10 h-10 rounded-xl bg-champagne-200 flex items-center justify-center text-amber-900 mb-3">
            <Users className="w-5 h-5" />
          </div>
          <h2 className="font-semibold text-plum-950 mb-1 text-base">Guest & RSVP Costing</h2>
          <p className="text-xs text-stone-700 leading-relaxed">
            Tracks confirmed headcount, dietary needs breakdown, and auto-calculates per-head cost dynamically.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white/80 border border-ivory-300 shadow-soft">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 mb-3">
            <Share2 className="w-5 h-5 text-emerald-700" />
          </div>
          <h2 className="font-semibold text-plum-950 mb-1 text-base">Compressed URL Sharing</h2>
          <p className="text-xs text-stone-700 leading-relaxed">
            Encodes the whole event into a shareable read-only link without requiring a server database or login.
          </p>
        </div>
      </div>

      {/* Quick Event Category Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif font-bold text-plum-950">Select Event Type to Begin</h2>
          <span className="text-xs text-stone-700">Pre-tailored budget weights & schemas</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { type: 'college_fest' as EventType, label: 'College Fest', desc: 'Aura \'26 Sample', emoji: '🎸', badge: 'Demo Ready' },
            { type: 'wedding' as EventType, label: 'Wedding & Sangeet', desc: 'Opulent & Multi-day', emoji: '💍' },
            { type: 'birthday' as EventType, label: 'Birthday Party', desc: 'Interactive & Fun', emoji: '🎂' },
            { type: 'anniversary' as EventType, label: 'Anniversary Gala', desc: 'Elegant & Intimate', emoji: '🥂' },
            { type: 'community' as EventType, label: 'Community Event', desc: 'Inclusive & Cultural', emoji: '🎪' },
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => {
                if (item.type === 'college_fest') {
                  onLoadSample();
                } else {
                  onStartNew(item.type);
                }
              }}
              type="button"
              className="text-left p-4 rounded-xl bg-white hover:bg-plum-50/50 border border-ivory-300 hover:border-plum-300 transition-all shadow-xs group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{item.emoji}</span>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-coral-100 text-coral-800">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="font-semibold text-sm text-plum-950 group-hover:text-coral-600 transition-colors">
                {item.label}
              </p>
              <p className="text-xs text-stone-700 mt-0.5">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
