import React from 'react';
import { Palette, Utensils, Music, Sparkles, Check, Heart, Shield } from 'lucide-react';
import { ConceptData, EventFormInput } from '../../types';

interface ConceptTabProps {
  concept: ConceptData;
  input: EventFormInput;
}

export const ConceptTab: React.FC<ConceptTabProps> = ({ concept, input }) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Thematic Tagline Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-plum-950 via-plum-900 to-coral-800 text-white p-6 sm:p-10 shadow-elevated">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-coral-200 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Creative Blueprint</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white">
            "{concept.tagline}"
          </h2>
          <p className="text-sm text-plum-100 leading-relaxed">
            A bespoke celebration blending {input.theme} aesthetics with the vibrant hospitality of {input.city}.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
          <Sparkles className="w-96 h-96 text-white" />
        </div>
      </div>

      {/* Decor & Styling Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-coral-600" />
          <h3 className="font-serif font-bold text-xl text-plum-950">Decor Vision & Ambiance</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {concept.decor.map((item, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl bg-white border border-ivory-300 shadow-soft space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-lg text-plum-950">{item.title}</h4>
                  <p className="text-xs text-stone-700 mt-1">{item.description}</p>
                </div>
                <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-plum-100 text-plum-900">
                  ~{item.estCostSharePercent}% budget
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-ivory-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700">
                  Key Decor Elements
                </span>
                <ul className="space-y-1.5">
                  {item.items.map((sub, sIdx) => (
                    <li key={sIdx} className="text-xs text-stone-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-coral-500" />
                      <span>{sub}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Culinary Concept */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-ivory-300 shadow-soft space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-coral-100 flex items-center justify-center text-coral-700">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-plum-950">{concept.food.title}</h3>
              <p className="text-xs text-stone-700">Catering tailored for {input.guests} guests in {input.city}</p>
            </div>
          </div>

          {input.dietary.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {input.dietary.map((d) => (
                <span key={d} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  ✓ {d}
                </span>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
          {concept.food.description}
        </p>

        {/* Menu Highlights */}
        <div>
          <span className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-3">
            Signature Menu Highlights
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {concept.food.highlights.map((dish, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-ivory-200/60 border border-ivory-300">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-xs text-stone-800 font-medium">{dish}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dietary accommodations notice */}
        <div className="p-4 rounded-2xl bg-champagne-100/80 border border-champagne-300 text-xs text-stone-800 flex items-start gap-3">
          <Shield className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <div>
            <strong className="font-semibold text-plum-950">Dietary Safety Accommodation:</strong>{' '}
            {concept.food.dietaryAccommodations}
          </div>
        </div>
      </div>

      {/* Entertainment & Guest Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entertainment */}
        <div className="p-6 rounded-3xl bg-white border border-ivory-300 shadow-soft space-y-4">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-plum-800" />
            <h3 className="font-serif font-bold text-lg text-plum-950">{concept.entertainment.title}</h3>
          </div>
          <p className="text-xs text-stone-700">{concept.entertainment.description}</p>
          <div className="p-3 rounded-xl bg-plum-50/70 border border-plum-100 text-xs text-plum-900">
            <strong>Lineup Progression:</strong> {concept.entertainment.scheduleSuggestion}
          </div>
          <ul className="space-y-2">
            {concept.entertainment.highlights.map((hl, idx) => (
              <li key={idx} className="text-xs text-stone-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-plum-700" />
                <span>{hl}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Activities */}
        <div className="p-6 rounded-3xl bg-white border border-ivory-300 shadow-soft space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-coral-600" />
            <h3 className="font-serif font-bold text-lg text-plum-950">Interactive Guest Activities</h3>
          </div>
          <div className="space-y-3">
            {concept.activities.map((act, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-ivory-200/50 border border-ivory-300 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-plum-950">{act.title}</h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-coral-100 text-coral-800 font-medium">
                    {act.targetAudience}
                  </span>
                </div>
                <p className="text-xs text-stone-700">{act.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

