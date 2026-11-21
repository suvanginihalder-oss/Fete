import React from "react";
import { Users, Home, CheckCircle, Sparkles } from "lucide-react";
import type {
  HouseholdProfile,
  HouseholdMember,
  CommuteMode,
  HomeType,
  CookingFuel,
} from "../types/index.js";

interface ProfileFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: HouseholdProfile;
  onSave: (updated: HouseholdProfile) => void;
}

export const ProfileFormModal: React.FC<ProfileFormModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [formData, setFormData] = React.useState<HouseholdProfile>(profile);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    setFormData(profile);
  }, [profile]);

  if (!isOpen) return null;

  const toggleMember = (m: HouseholdMember) => {
    const exists = formData.members.includes(m);
    const updated = exists
      ? formData.members.filter((x) => x !== m)
      : [...formData.members, m];
    if (updated.length === 0) return;
    setFormData({ ...formData, members: updated });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.city.trim()) {
      setErrorMsg("City name is required.");
      return;
    }
    setErrorMsg(null);
    onSave(formData);
    onClose();
  };

  const memberOptions: { id: HouseholdMember; label: string; desc: string }[] =
    [
      {
        id: "children",
        label: "Children / Infants",
        desc: "Higher breathing rate relative to body mass",
      },
      {
        id: "elderly",
        label: "Elderly (>65 yrs)",
        desc: "Susceptible to cardiovascular strain",
      },
      {
        id: "asthma_respiratory",
        label: "Asthma / Bronchitis",
        desc: "Airway hyper-reactivity to PM2.5",
      },
      {
        id: "heart_condition",
        label: "Heart Conditions",
        desc: "Systemic inflammation from fine particles",
      },
      {
        id: "pregnancy",
        label: "Pregnancy",
        desc: "Placental barrier protection needed",
      },
      {
        id: "healthy_adult",
        label: "Healthy Adults",
        desc: "Long-term lung capacity defence",
      },
    ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        <div className="p-5 bg-emerald-800 text-white flex items-center justify-between">
          <div>
            <h2 id="profile-modal-title" className="text-lg font-bold">
              Household Smog Vulnerability Profile
            </h2>
            <p className="text-xs text-emerald-200 mt-0.5">
              Personalize risk warnings and low-emission routines for your
              family.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-emerald-700 text-emerald-100 hover:text-white"
            aria-label="Close profile configuration"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 max-h-[80vh] overflow-y-auto"
        >
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {errorMsg}
            </div>
          )}

          {/* City */}
          <div>
            <label
              htmlFor="city-input"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1"
            >
              Primary City
            </label>
            <input
              id="city-input"
              type="text"
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g. Delhi, Gurgaon, Noida, Mumbai, Kolkata"
              required
            />
          </div>

          {/* Members */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" /> Household Members
              (Select All That Apply)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {memberOptions.map((opt) => {
                const isSelected = formData.members.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleMember(opt.id)}
                    className={`text-left p-3 rounded-xl border text-xs transition-colors flex items-start gap-2.5 ${
                      isSelected
                        ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold"
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <CheckCircle
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        isSelected ? "text-emerald-600" : "text-slate-300"
                      }`}
                    />
                    <div>
                      <div>{opt.label}</div>
                      <div className="text-[10px] text-slate-500 font-normal">
                        {opt.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Commute */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="commute-mode-select"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1"
              >
                Primary Commute Mode
              </label>
              <select
                id="commute-mode-select"
                value={formData.commuteMode}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    commuteMode: e.target.value as CommuteMode,
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="car_petrol_diesel">Petrol / Diesel Car</option>
                <option value="motorcycle_scooter">Motorcycle / Scooter</option>
                <option value="electric_vehicle">Electric Vehicle (EV)</option>
                <option value="bus">Municipal Bus</option>
                <option value="metro_train">Metro / Local Train</option>
                <option value="bicycle">Bicycle</option>
                <option value="walk">Walking</option>
                <option value="work_from_home">Work From Home</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="distance-input"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1"
              >
                One-Way Commute Distance (km)
              </label>
              <input
                id="distance-input"
                type="number"
                min="0"
                max="100"
                value={formData.commuteDistanceKm}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    commuteDistanceKm: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Home & Ventilation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="home-type-select"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1"
              >
                <Home className="w-3.5 h-3.5 text-slate-500" /> Home Type
              </label>
              <select
                id="home-type-select"
                value={formData.homeType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    homeType: e.target.value as HomeType,
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="high_rise_apartment">
                  High-Rise Apartment (Floor 5+)
                </option>
                <option value="low_rise_apartment">
                  Low-Rise Apartment (Ground - 4)
                </option>
                <option value="independent_house">
                  Independent House / Villa
                </option>
                <option value="slum_or_dense_cluster">
                  Dense Urban Settlement
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="fuel-select"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1"
              >
                Primary Cooking Fuel
              </label>
              <select
                id="fuel-select"
                value={formData.cookingFuel}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cookingFuel: e.target.value as CookingFuel,
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="piped_gas_lpg">
                  Piped Natural Gas (PNG) / LPG
                </option>
                <option value="induction_electric">
                  Induction / Electric Stove
                </option>
                <option value="wood_biomass_coal">Wood / Biomass / Coal</option>
              </select>
            </div>
          </div>

          {/* Purifier & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  Air Purifier at Home?
                </div>
                <div className="text-[10px] text-slate-500">
                  True HEPA filtration available
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.hasAirPurifier}
                onChange={(e) =>
                  setFormData({ ...formData, hasAirPurifier: e.target.checked })
                }
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                aria-label="Do you own an air purifier?"
              />
            </div>

            <div>
              <label
                htmlFor="budget-input"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1"
              >
                Monthly Smog Budget (₹ INR)
              </label>
              <input
                id="budget-input"
                type="number"
                min="0"
                step="500"
                value={formData.monthlyBudgetInr}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    monthlyBudgetInr: Number(e.target.value),
                  })
                }
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1.5 focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            >
              <Sparkles className="w-3.5 h-3.5" /> Save Profile & Update Advice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
