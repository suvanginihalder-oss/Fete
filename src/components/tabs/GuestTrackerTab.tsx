import React, { useState } from "react";
import {
  Users,
  UserPlus,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
  Shield,
  DollarSign,
} from "lucide-react";
import { GuestItem } from "../../types";
import { calculateGuestMetrics } from "../../lib/math";

interface GuestTrackerTabProps {
  guests: GuestItem[];
  totalBudget: number;
  expectedGuests: number;
  currency: string;
  onUpdateGuests: (updatedGuests: GuestItem[]) => void;
  isReadOnly?: boolean;
}

export const GuestTrackerTab: React.FC<GuestTrackerTabProps> = ({
  guests,
  totalBudget,
  expectedGuests,
  currency,
  onUpdateGuests,
  isReadOnly,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<"confirmed" | "pending" | "declined">(
    "confirmed",
  );
  const [dietaryNote, setDietaryNote] = useState("");
  const [plusOnes, setPlusOnes] = useState(0);

  const metrics = calculateGuestMetrics(guests, totalBudget, expectedGuests);

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newGuest: GuestItem = {
      id: `guest-${Date.now()}`,
      name: name.trim(),
      emailOrPhone: contact.trim(),
      status,
      dietaryNote: dietaryNote.trim(),
      plusOnes: Math.max(0, plusOnes),
    };

    onUpdateGuests([...guests, newGuest]);
    setName("");
    setContact("");
    setDietaryNote("");
    setPlusOnes(0);
    setShowAddModal(false);
  };

  const handleStatusChange = (
    id: string,
    newStatus: "confirmed" | "pending" | "declined",
  ) => {
    if (isReadOnly) return;
    const updated = guests.map((g) =>
      g.id === id ? { ...g, status: newStatus } : g,
    );
    onUpdateGuests(updated);
  };

  const handleDeleteGuest = (id: string) => {
    if (isReadOnly) return;
    const updated = guests.filter((g) => g.id !== id);
    onUpdateGuests(updated);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Confirmed Attending */}
        <div className="p-5 rounded-3xl bg-white border border-ivory-300 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-stone-700 font-semibold uppercase tracking-wider">
              Confirmed
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-emerald-800">
            {metrics.confirmed}
          </p>
          <span className="text-[11px] text-stone-700">
            headcount attending
          </span>
        </div>

        {/* Pending Awaiting RSVP */}
        <div className="p-5 rounded-3xl bg-white border border-ivory-300 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-stone-700 font-semibold uppercase tracking-wider">
              Pending
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-amber-800">
            {metrics.pending}
          </p>
          <span className="text-[11px] text-stone-700">
            awaiting RSVP response
          </span>
        </div>

        {/* Declined */}
        <div className="p-5 rounded-3xl bg-white border border-ivory-300 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-stone-700 font-semibold uppercase tracking-wider">
              Declined
            </span>
            <XCircle className="w-4 h-4 text-stone-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-stone-700">
            {metrics.declined}
          </p>
          <span className="text-[11px] text-stone-700">unable to attend</span>
        </div>

        {/* Per-Head Cost Math */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-plum-900 to-plum-950 text-white shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-coral-200 font-semibold uppercase tracking-wider">
              Per-Head Cost
            </span>
            <DollarSign className="w-4 h-4 text-coral-300" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-white">
            {currency} {metrics.perHeadCost.toLocaleString()}
          </p>
          <span className="text-[11px] text-plum-200">
            total budget ÷ {metrics.effectiveGuests} guests
          </span>
        </div>
      </div>

      {/* Dietary Needs Aggregation Card */}
      {Object.keys(metrics.dietaryCounts).length > 0 && (
        <div className="p-6 rounded-3xl bg-champagne-100/70 border border-champagne-300 shadow-soft">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-amber-800" />
            <h4 className="font-serif font-bold text-sm text-plum-950">
              Dietary Accommodation Counts (For Caterer)
            </h4>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {Object.entries(metrics.dietaryCounts).map(([diet, count]) => (
              <span
                key={diet}
                className="px-3 py-1.5 rounded-xl bg-white border border-champagne-300 text-xs text-stone-800 font-medium shadow-2xs"
              >
                <strong className="text-plum-950 font-bold">{count}x</strong>{" "}
                {diet}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Guest List Header & Add Button */}
      <div className="bg-white rounded-3xl border border-ivory-300 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-ivory-300 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-serif font-bold text-lg text-plum-950">
              Guest Roster & Status
            </h3>
            <p className="text-xs text-stone-700">
              Track RSVPs, plus-ones, and dietary restrictions
            </p>
          </div>

          {!isReadOnly && (
            <button
              onClick={() => setShowAddModal(true)}
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-plum-900 hover:bg-plum-950 transition-colors shadow-soft"
            >
              <UserPlus className="w-4 h-4 text-coral-300" />
              <span>Add Guest</span>
            </button>
          )}
        </div>

        {/* Add Guest Modal */}
        {showAddModal && (
          <div className="p-6 bg-ivory-100 border-b border-ivory-300">
            <form onSubmit={handleAddGuest} className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-plum-950">
                Add Guest Information
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Full Name *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                />
                <input
                  type="text"
                  placeholder="Email or WhatsApp"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                />
                <input
                  type="text"
                  placeholder="Dietary Note (e.g. Pure Veg, Jain)"
                  value={dietaryNote}
                  onChange={(e) => setDietaryNote(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                  >
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="declined">Declined</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    placeholder="+Ones"
                    value={plusOnes}
                    onChange={(e) => setPlusOnes(parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-2 text-xs rounded-xl border border-stone-300 bg-white"
                    title="Number of plus ones"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-1.5 text-xs text-stone-700 hover:bg-ivory-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-plum-900 hover:bg-plum-950 rounded-lg"
                >
                  Save Guest
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory-100 text-stone-700 uppercase font-semibold border-b border-ivory-300">
              <tr>
                <th className="px-5 py-3">Guest Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Headcount</th>
                <th className="px-4 py-3">Dietary Accommodation</th>
                <th className="px-4 py-3">RSVP Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200">
              {guests.map((g) => (
                <tr
                  key={g.id}
                  className="hover:bg-ivory-50/80 transition-colors"
                >
                  <td className="px-5 py-3.5 font-semibold text-plum-950">
                    {g.name}
                  </td>
                  <td className="px-4 py-3.5 text-stone-700">
                    {g.emailOrPhone || "—"}
                  </td>
                  <td className="px-4 py-3.5 font-mono">
                    1{" "}
                    {g.plusOnes > 0 && (
                      <span className="text-coral-600 font-bold">
                        (+{g.plusOnes})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {g.dietaryNote ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-medium">
                        {g.dietaryNote}
                      </span>
                    ) : (
                      <span className="text-stone-700 text-[11px]">
                        Standard
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    {isReadOnly ? (
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${
                          g.status === "confirmed"
                            ? "bg-emerald-100 text-emerald-800"
                            : g.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-stone-200 text-stone-700"
                        }`}
                      >
                        {g.status}
                      </span>
                    ) : (
                      <select
                        value={g.status}
                        onChange={(e) =>
                          handleStatusChange(g.id, e.target.value as any)
                        }
                        className={`text-xs font-semibold px-2 py-1 rounded-lg border ${
                          g.status === "confirmed"
                            ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                            : g.status === "pending"
                              ? "bg-amber-50 border-amber-300 text-amber-900"
                              : "bg-stone-100 border-stone-300 text-stone-700"
                        }`}
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="pending">Pending</option>
                        <option value="declined">Declined</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {!isReadOnly && (
                      <button
                        onClick={() => handleDeleteGuest(g.id)}
                        type="button"
                        className="p-1 rounded text-stone-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove guest"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
