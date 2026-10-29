import React from 'react';
import { Calendar, MapPin, Users, DollarSign, Sparkles, Share2, Printer, Download, ShieldAlert, Edit3 } from 'lucide-react';
import { EventPlan } from '../types';

interface PlanHeaderProps {
  plan: EventPlan;
  onOpenChat: () => void;
  onOpenShare: () => void;
  onPrint: () => void;
  onExport: () => void;
  onEdit: () => void;
  isReadOnly?: boolean;
}

export const PlanHeader: React.FC<PlanHeaderProps> = ({
  plan,
  onOpenChat,
  onOpenShare,
  onPrint,
  onExport,
  onEdit,
  isReadOnly,
}) => {
  const { input, budget, isDemoMode, demoBannerMessage } = plan;

  // Days countdown
  const eventDate = new Date(input.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const countdownText = diffDays > 0 ? `${diffDays} days away` : diffDays === 0 ? 'Today!' : 'Completed';

  return (
    <div className="bg-white border-b border-ivory-300 shadow-soft">
      {/* Demo Safety Banner: Never present demo output as live AI */}
      {isDemoMode && (
        <div className="bg-amber-500/10 border-b border-amber-300/60 px-4 py-2 text-center text-xs font-semibold text-amber-900 flex items-center justify-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            {demoBannerMessage || 'Sample plan, not live AI (Demo Safety Active — zero flaky API dependencies)'}
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Main Info */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-plum-100 text-plum-900 border border-plum-200">
                {input.eventType.replace('_', ' ')}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-coral-100 text-coral-800">
                ⏳ {countdownText}
              </span>
              {isReadOnly && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-200 text-stone-800">
                  Read-Only Mode
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-plum-950 tracking-tight">
              {input.name}
            </h1>

            {/* Quick Metrics Pills */}
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-stone-700">
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-coral-600" />
                {new Date(input.date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-4 h-4 text-coral-600" />
                {input.city}
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="w-4 h-4 text-coral-600" />
                {input.guests} Expected Guests
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-plum-900 bg-champagne-200/60 px-2.5 py-1 rounded-lg">
                <DollarSign className="w-4 h-4 text-plum-800" />
                Budget: {input.currency} {budget.totalBudget.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={onOpenChat}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-plum-900 to-coral-700 hover:from-plum-950 hover:to-coral-800 shadow-soft transition-all transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-coral-200" />
              <span>Ask AI Assistant</span>
            </button>

            <button
              onClick={onOpenShare}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-stone-700 hover:text-plum-900 hover:bg-ivory-200 border border-ivory-300 transition-colors"
              title="Share read-only compressed link or WhatsApp invitation"
            >
              <Share2 className="w-4 h-4 text-stone-600" />
              <span>Share & Invite</span>
            </button>

            <button
              onClick={onPrint}
              type="button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-stone-700 hover:text-plum-900 hover:bg-ivory-200 border border-ivory-300 transition-colors"
              title="Print-friendly view or PDF export"
            >
              <Printer className="w-4 h-4 text-stone-600" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            <button
              onClick={onExport}
              type="button"
              className="p-2 rounded-xl text-stone-700 hover:text-plum-900 hover:bg-ivory-200 border border-ivory-300 transition-colors"
              title="Export JSON backup"
            >
              <Download className="w-4 h-4" />
            </button>

            {!isReadOnly && (
              <button
                onClick={onEdit}
                type="button"
                className="p-2 rounded-xl text-stone-700 hover:text-plum-900 hover:bg-ivory-200 border border-ivory-300 transition-colors"
                title="Edit event parameters"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

