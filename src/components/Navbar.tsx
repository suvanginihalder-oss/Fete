import React from 'react';
import { Sparkles, Calendar, FolderHeart, PlusCircle, Share2, BookOpen } from 'lucide-react';
import { EventPlan } from '../types';

interface NavbarProps {
  activePlan: EventPlan | null;
  savedPlansCount: number;
  onOpenNewEvent: () => void;
  onLoadSample: () => void;
  onOpenSavedPlans: () => void;
  onOpenChat: () => void;
  isReadOnly?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePlan,
  savedPlansCount,
  onOpenNewEvent,
  onLoadSample,
  onOpenSavedPlans,
  onOpenChat,
  isReadOnly,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-ivory-100/90 backdrop-blur-md border-b border-ivory-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-plum-900 via-plum-800 to-coral-600 flex items-center justify-center text-white shadow-soft">
            <Sparkles className="w-5 h-5 text-coral-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-xl tracking-tight text-plum-950">
                Celebr<span className="text-coral-600">AI</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-plum-100 text-plum-800">
                GenAI Planner
              </span>
            </div>
            <p className="text-xs text-stone-700 hidden sm:block">Intelligent Parallel Event Architect</p>
          </div>
        </div>

        {/* Read-only pill if shared */}
        {isReadOnly && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-medium border border-amber-300">
            <Share2 className="w-3.5 h-3.5 text-amber-700" />
            <span>Read-Only Shared View</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Load Sample Button (Judges Demo Priority) */}
          <button
            onClick={onLoadSample}
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-plum-900 bg-champagne-200/80 hover:bg-champagne-300 border border-champagne-400/60 transition-colors shadow-xs"
            title="Load college cultural fest sample (zero API setup)"
          >
            <BookOpen className="w-4 h-4 text-plum-800" />
            <span className="hidden md:inline">Load Sample Event</span>
            <span className="md:hidden">Sample</span>
          </button>

          {/* Saved Plans */}
          <button
            onClick={onOpenSavedPlans}
            type="button"
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-stone-700 hover:text-plum-900 hover:bg-ivory-200 border border-ivory-300 transition-colors"
            title="Saved events dashboard"
          >
            <FolderHeart className="w-4 h-4 text-stone-600" />
            <span className="hidden sm:inline">Saved</span>
            {savedPlansCount > 0 && (
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-coral-600 text-white">
                {savedPlansCount}
              </span>
            )}
          </button>

          {/* New Event Form */}
          <button
            onClick={onOpenNewEvent}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-plum-900 to-plum-800 hover:from-plum-950 hover:to-plum-900 shadow-soft transition-all transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4 text-coral-300" />
            <span>New Event</span>
          </button>

          {/* Chat Assistant Button if active plan */}
          {activePlan && (
            <button
              onClick={onOpenChat}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-coral-800 bg-coral-50 hover:bg-coral-100 border border-coral-200 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-coral-600" />
              <span className="hidden lg:inline">AI Assistant</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

