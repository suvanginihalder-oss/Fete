import React from 'react';
import { X, Calendar, MapPin, Users, DollarSign, Trash2, ArrowRight, FolderHeart, PlusCircle, Sparkles } from 'lucide-react';
import { EventPlan } from '../types';

interface SavedPlansDrawerProps {
  isOpen: boolean;
  plans: EventPlan[];
  activePlanId: string | null;
  onClose: () => void;
  onSelectPlan: (plan: EventPlan) => void;
  onDeletePlan: (id: string) => void;
  onNewEvent: () => void;
  onLoadSample: () => void;
}

export const SavedPlansDrawer: React.FC<SavedPlansDrawerProps> = ({
  isOpen,
  plans,
  activePlanId,
  onClose,
  onSelectPlan,
  onDeletePlan,
  onNewEvent,
  onLoadSample,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden bg-stone-900/40 backdrop-blur-xs flex justify-end"
    >
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-ivory-300 animate-slideLeft">
        {/* Header */}
        <div className="px-5 py-4 bg-plum-950 text-white flex items-center justify-between shadow-soft">
          <div className="flex items-center gap-2.5">
            <FolderHeart className="w-5 h-5 text-coral-400" />
            <div>
              <h3 className="font-serif font-bold text-base text-white">Saved Events Dashboard</h3>
              <p className="text-[11px] text-plum-200">Persisted locally ({plans.length})</p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Header */}
        <div className="p-3 bg-ivory-100 border-b border-ivory-300 flex items-center gap-2">
          <button
            onClick={() => {
              onClose();
              onNewEvent();
            }}
            type="button"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-plum-900 hover:bg-plum-950 transition-colors shadow-2xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-coral-300" />
            <span>Create New</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onLoadSample();
            }}
            type="button"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-plum-900 bg-champagne-200 hover:bg-champagne-300 border border-champagne-400/50 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-coral-600" />
            <span>Load Sample Fest</span>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-ivory-50">
          {plans.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <FolderHeart className="w-12 h-12 text-stone-300 mx-auto" />
              <h4 className="font-serif font-bold text-stone-700">No Saved Events Yet</h4>
              <p className="text-xs text-stone-700 max-w-xs mx-auto">
                Create a new event blueprint or load the college cultural fest sample to get started.
              </p>
            </div>
          ) : (
            plans.map((p) => {
              const isActive = p.id === activePlanId;

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelectPlan(p);
                    onClose();
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                    isActive
                      ? 'bg-plum-50/80 border-plum-400 shadow-soft ring-1 ring-plum-400'
                      : 'bg-white border-ivory-300 hover:border-plum-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-plum-100 text-plum-900">
                          {p.input.eventType.replace('_', ' ')}
                        </span>
                        {isActive && (
                          <span className="text-[10px] font-semibold text-coral-600">Active</span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-plum-950 group-hover:text-coral-600 transition-colors">
                        {p.input.name}
                      </h4>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${p.input.name}"?`)) {
                          onDeletePlan(p.id);
                        }
                      }}
                      type="button"
                      className="p-1 rounded text-stone-600 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-ivory-200 text-[11px] text-stone-700">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-stone-600" />
                      {p.input.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-stone-600" />
                      {p.input.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-stone-600" />
                      {p.input.guests} guests
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-plum-900 font-mono">
                      <DollarSign className="w-3 h-3 text-plum-800" />
                      {p.input.currency} {p.budget.totalBudget.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

