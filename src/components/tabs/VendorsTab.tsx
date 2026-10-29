import React from 'react';
import { Briefcase, CloudRain, Lightbulb, CheckSquare, MessageCircle, DollarSign, ShieldAlert } from 'lucide-react';
import { VendorItem, WeatherPlanB, VendorStatus } from '../../types';

interface VendorsTabProps {
  vendors: VendorItem[];
  weatherPlanB: WeatherPlanB;
  expertTips: string[];
  currency: string;
  onUpdateVendors: (updated: VendorItem[]) => void;
  isReadOnly?: boolean;
}

export const VendorsTab: React.FC<VendorsTabProps> = ({
  vendors,
  weatherPlanB,
  expertTips,
  currency,
  onUpdateVendors,
  isReadOnly,
}) => {
  const handleStatusChange = (id: string, newStatus: VendorStatus) => {
    if (isReadOnly) return;
    const updated = vendors.map((v) => (v.id === id ? { ...v, status: newStatus } : v));
    onUpdateVendors(updated);
  };

  const handleBookedCostChange = (id: string, amount: number) => {
    if (isReadOnly) return;
    const updated = vendors.map((v) => (v.id === id ? { ...v, bookedCost: amount } : v));
    onUpdateVendors(updated);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Weather Plan B Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200/80 shadow-soft space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-900">
            <CloudRain className="w-5 h-5 text-amber-800" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-xl text-amber-950">Weather Plan B & Rain Contingency</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                Risk Management
              </span>
            </div>
            <p className="text-xs text-amber-900 mt-0.5">{weatherPlanB.riskAssessment}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Contingency Actions */}
          <div className="p-4 rounded-2xl bg-white/80 border border-amber-200/70 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-950 block">
              Contingency Action Steps
            </span>
            <ul className="space-y-1.5">
              {weatherPlanB.contingencySteps.map((step, idx) => (
                <li key={idx} className="text-xs text-stone-800 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Backup Gear & Venues */}
          <div className="p-4 rounded-2xl bg-white/80 border border-amber-200/70 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-950 block">
              Standby Gear & Alternative Venues
            </span>
            <ul className="space-y-1.5">
              {weatherPlanB.backupVenuesOrGear.map((item, idx) => (
                <li key={idx} className="text-xs text-stone-800 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Vendor Checklist Cards */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-plum-900" />
            <h3 className="font-serif font-bold text-xl text-plum-950">Vendor Categories & Negotiation Checklist</h3>
          </div>
          <span className="text-xs text-stone-700">
            *Objective price ranges & strategic questions. No fabricated provider listings.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className="p-6 rounded-3xl bg-white border border-ivory-300 shadow-soft space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-lg text-plum-950">{vendor.serviceType}</h4>
                  <span className="inline-block mt-1 text-xs font-mono font-bold text-coral-700 bg-coral-50 px-2 py-0.5 rounded border border-coral-200">
                    Est. Range: {vendor.estCostRange}
                  </span>
                </div>

                {/* Status selector */}
                <div>
                  {isReadOnly ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize bg-plum-100 text-plum-900">
                      {vendor.status.replace('_', ' ')}
                    </span>
                  ) : (
                    <select
                      value={vendor.status}
                      onChange={(e) => handleStatusChange(vendor.id, e.target.value as VendorStatus)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-xl border ${
                        vendor.status === 'booked'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : vendor.status === 'shortlisted'
                          ? 'bg-amber-50 border-amber-300 text-amber-900'
                          : 'bg-ivory-200 border-ivory-300 text-stone-700'
                      }`}
                    >
                      <option value="not_contacted">Not Contacted</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="booked">Booked & Locked</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Questions To Ask */}
              <div className="space-y-2 pt-2 border-t border-ivory-200">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-stone-600" />
                  <span>Crucial Questions to Ask Vendor</span>
                </span>
                <ul className="space-y-2">
                  {vendor.questionsToAsk.map((q, qIdx) => (
                    <li key={qIdx} className="text-xs text-stone-700 flex items-start gap-2 bg-ivory-100/60 p-2.5 rounded-xl border border-ivory-200">
                      <CheckSquare className="w-3.5 h-3.5 text-coral-600 mt-0.5 shrink-0" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Booked Cost input if booked */}
              {vendor.status === 'booked' && !isReadOnly && (
                <div className="pt-2 flex items-center justify-between text-xs bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200">
                  <span className="font-semibold text-emerald-900">Contract Final Cost:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-emerald-900">{currency}</span>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={vendor.bookedCost || ''}
                      onChange={(e) => handleBookedCostChange(vendor.id, parseInt(e.target.value) || 0)}
                      className="w-24 px-2 py-0.5 text-xs rounded border border-emerald-300 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Expert Planning Tips */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-ivory-300 shadow-soft space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-coral-600" />
          <h3 className="font-serif font-bold text-lg text-plum-950">Expert Coordinator Field Insights</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {expertTips.map((tip, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-ivory-200/50 border border-ivory-300 text-xs text-stone-800 flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-plum-800 mt-1.5 shrink-0" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
