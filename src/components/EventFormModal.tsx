import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  AlertCircle,
  Calendar,
  Users,
  DollarSign,
  MapPin,
  Palette,
  HeartHandshake,
} from "lucide-react";
import { EventFormInput, EventType } from "../types";
import { eventFormSchema } from "../lib/schemas";
import { getSampleEventDate } from "../lib/sampleData";

interface EventFormModalProps {
  isOpen: boolean;
  initialType?: EventType;
  onClose: () => void;
  onSubmit: (data: EventFormInput) => void;
}

const DIETARY_OPTIONS = [
  "Pure Veg",
  "Jain Option",
  "Halal",
  "Gluten-Free",
  "Vegan",
  "Nut-Free",
  "Non-Veg Accommodated",
];

const ACCESSIBILITY_OPTIONS = [
  "Wheelchair Ramps & Wide Aisles",
  "Quiet Sensory-Friendly Space",
  "Ground Floor / Elevator Access",
  "Sign Language / Audio Assist",
  "Dedicated Elder Seating Area",
];

export const EventFormModal: React.FC<EventFormModalProps> = ({
  isOpen,
  initialType = "wedding",
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<EventFormInput>({
    eventType: initialType,
    name: "",
    date: getSampleEventDate(),
    city: "Bengaluru",
    guests: 150,
    budget: 150000,
    currency: "₹",
    theme: "Warm Festive Glow",
    dietary: ["Pure Veg", "Jain Option"],
    accessibility: [
      "Wheelchair Ramps & Wide Aisles",
      "Ground Floor / Elevator Access",
    ],
    culturalPreferences:
      "Traditional festive rituals with modern evening acoustics",
    specialRequests:
      "Include outdoor weather contingency and dedicated parking lanes",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialType) {
      setFormData((prev) => ({ ...prev, eventType: initialType }));
    }
  }, [initialType]);

  if (!isOpen) return null;

  const handleDietaryToggle = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      dietary: prev.dietary.includes(item)
        ? prev.dietary.filter((d) => d !== item)
        : [...prev.dietary, item],
    }));
  };

  const handleAccessibilityToggle = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      accessibility: prev.accessibility.includes(item)
        ? prev.accessibility.filter((a) => a !== item)
        : [...prev.accessibility, item],
    }));
  };

  const handleFillCollegeFest = () => {
    setFormData({
      eventType: "college_fest",
      name: "Aura '26: Annual Inter-College Cultural & Arts Fest",
      date: getSampleEventDate(),
      city: "Bengaluru",
      guests: 250,
      budget: 50000,
      currency: "₹",
      theme: "Retro Neon Waves & Indie Fusion",
      dietary: ["Pure Veg", "Jain Option", "Gluten-Free"],
      accessibility: [
        "Wheelchair Ramps & Wide Aisles",
        "Quiet Sensory-Friendly Space",
      ],
      culturalPreferences:
        "Youth collegiate fest: Battle of the bands, street play, DJ night",
      specialRequests:
        "Acoustic stage coverage, student volunteer coordination, noise curfew at 10 PM",
    });
    setErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = eventFormSchema.safeParse(formData);

    if (!result.success) {
      const errMap: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          errMap[String(err.path[0])] = err.message;
        }
      });
      setErrors(errMap);
      return;
    }

    setErrors({});
    onSubmit(result.data as EventFormInput);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-ivory-300 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-plum-900 via-plum-800 to-coral-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-coral-200" />
            </div>
            <div>
              <h2
                id="modal-title"
                className="font-serif font-bold text-xl text-white"
              >
                Plan a New Celebration
              </h2>
              <p className="text-xs text-coral-100">
                Parallel GenAI generation with code-owned math
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleFillCollegeFest}
              type="button"
              className="text-xs px-2.5 py-1 rounded-md bg-white/20 hover:bg-white/30 text-white font-medium transition-colors"
              title="Auto-fill with sample fest input"
            >
              Prefill Sample
            </button>
            <button
              onClick={onClose}
              type="button"
              aria-label="Close dialog"
              className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 max-h-[80vh] overflow-y-auto"
        >
          {/* Event Type & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="eventType"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
              >
                Event Type <span className="text-coral-600">*</span>
              </label>
              <select
                id="eventType"
                value={formData.eventType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    eventType: e.target.value as EventType,
                  })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-coral-500 bg-white"
              >
                <option value="wedding">💍 Wedding & Sangeet</option>
                <option value="birthday">🎂 Birthday Bash</option>
                <option value="anniversary">🥂 Anniversary Gala</option>
                <option value="college_fest">🎸 College Cultural Fest</option>
                <option value="community">🎪 Community Festival</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="name"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
              >
                Event Name <span className="text-coral-600">*</span>
              </label>
              <input
                id="name"
                type="text"
                placeholder="e.g., Aarav & Maya's Sangeet Celebration"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className={`w-full px-3 py-2 text-sm rounded-xl border ${
                  errors.name
                    ? "border-coral-500 bg-coral-50/30"
                    : "border-stone-300"
                } focus:outline-hidden focus:ring-2 focus:ring-coral-500`}
              />
              {errors.name && (
                <p className="text-xs text-coral-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </div>
          </div>

          {/* Date, City, Guests */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="date"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5 text-stone-700" />
                <span>Date</span> <span className="text-coral-600">*</span>
              </label>
              <input
                id="date"
                type="date"
                value={formData.date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className={`w-full px-3 py-2 text-sm rounded-xl border ${
                  errors.date
                    ? "border-coral-500 bg-coral-50/30"
                    : "border-stone-300"
                } focus:outline-hidden focus:ring-2 focus:ring-coral-500`}
              />
              {errors.date && (
                <p className="text-xs text-coral-600 mt-1">{errors.date}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="city"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5 text-stone-700" />
                <span>City / Venue</span>{" "}
                <span className="text-coral-600">*</span>
              </label>
              <input
                id="city"
                type="text"
                placeholder="e.g. Bengaluru, Mumbai, Delhi"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                className={`w-full px-3 py-2 text-sm rounded-xl border ${
                  errors.city
                    ? "border-coral-500 bg-coral-50/30"
                    : "border-stone-300"
                } focus:outline-hidden focus:ring-2 focus:ring-coral-500`}
              />
              {errors.city && (
                <p className="text-xs text-coral-600 mt-1">{errors.city}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="guests"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1"
              >
                <Users className="w-3.5 h-3.5 text-stone-700" />
                <span>Guests</span> <span className="text-coral-600">*</span>
              </label>
              <input
                id="guests"
                type="number"
                min="1"
                max="200000"
                value={formData.guests}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    guests: parseInt(e.target.value) || 0,
                  })
                }
                className={`w-full px-3 py-2 text-sm rounded-xl border ${
                  errors.guests
                    ? "border-coral-500 bg-coral-50/30"
                    : "border-stone-300"
                } focus:outline-hidden focus:ring-2 focus:ring-coral-500`}
              />
              {errors.guests && (
                <p className="text-xs text-coral-600 mt-1">{errors.guests}</p>
              )}
            </div>
          </div>

          {/* Budget & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label
                htmlFor="currency"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
              >
                Currency
              </label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) =>
                  setFormData({ ...formData, currency: e.target.value })
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-coral-500 bg-white"
              >
                <option value="₹">₹ INR (Rupees)</option>
                <option value="$">$ USD (Dollars)</option>
                <option value="€">€ EUR (Euros)</option>
                <option value="£">£ GBP (Pounds)</option>
                <option value="AED">AED (Dirhams)</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="budget"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1"
              >
                <DollarSign className="w-3.5 h-3.5 text-stone-700" />
                <span>Total Budget ({formData.currency})</span>{" "}
                <span className="text-coral-600">*</span>
              </label>
              <input
                id="budget"
                type="number"
                min="500"
                step="500"
                value={formData.budget}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    budget: parseInt(e.target.value) || 0,
                  })
                }
                className={`w-full px-3 py-2 text-sm rounded-xl border ${
                  errors.budget
                    ? "border-coral-500 bg-coral-50/30"
                    : "border-stone-300"
                } focus:outline-hidden focus:ring-2 focus:ring-coral-500`}
              />
              {errors.budget && (
                <p className="text-xs text-coral-600 mt-1">{errors.budget}</p>
              )}
            </div>
          </div>

          {/* Theme & Vibe */}
          <div>
            <label
              htmlFor="theme"
              className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5 flex items-center gap-1"
            >
              <Palette className="w-3.5 h-3.5 text-stone-700" />
              <span>Theme / Aesthetic Vibe</span>
            </label>
            <input
              id="theme"
              type="text"
              placeholder="e.g. Royal Marigold & Pastel Silk, Neon Cyberpunk, Rustic Garden Party"
              value={formData.theme}
              onChange={(e) =>
                setFormData({ ...formData, theme: e.target.value })
              }
              className="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-coral-500"
            />
          </div>

          {/* Dietary Needs Pills */}
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              Dietary Accommodations
            </span>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map((item) => {
                const isSelected = formData.dietary.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleDietaryToggle(item)}
                    className={`px-3 py-1 text-xs rounded-full border transition-all ${
                      isSelected
                        ? "bg-plum-900 text-white border-plum-950 font-medium"
                        : "bg-ivory-200 text-stone-700 border-ivory-300 hover:bg-ivory-300"
                    }`}
                  >
                    {isSelected ? "✓ " : "+ "} {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Accessibility Requirements */}
          <div>
            <span className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2 flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5 text-stone-700" />
              <span>Accessibility Preferences</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ACCESSIBILITY_OPTIONS.map((item) => {
                const isChecked = formData.accessibility.includes(item);
                return (
                  <label
                    key={item}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border cursor-pointer transition-colors ${
                      isChecked
                        ? "bg-coral-50 border-coral-300 text-coral-900 font-medium"
                        : "bg-white border-stone-200 text-stone-700"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleAccessibilityToggle(item)}
                      className="rounded text-coral-600 focus:ring-coral-500"
                    />
                    <span>{item}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Cultural Preferences & Special Requests */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="cultural"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
              >
                Cultural / Music Preferences
              </label>
              <textarea
                id="cultural"
                rows={2}
                placeholder="e.g. Traditional Nadhaswaram entry, Punjabi Sangeet beats, Indie rock bands"
                value={formData.culturalPreferences}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    culturalPreferences: e.target.value,
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-coral-500"
              />
            </div>

            <div>
              <label
                htmlFor="special"
                className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5"
              >
                Special Requests & Constraints
              </label>
              <textarea
                id="special"
                rows={2}
                placeholder="e.g. Rain-proof canopy, elderly drop-off zone, 10 PM sound curfew"
                value={formData.specialRequests}
                onChange={(e) =>
                  setFormData({ ...formData, specialRequests: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-coral-500"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 border-t border-ivory-300 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-stone-700 hover:bg-ivory-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-plum-900 to-coral-700 hover:from-plum-950 hover:to-coral-800 rounded-xl shadow-soft transition-all transform active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-coral-200" />
              <span>Generate AI Blueprint</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
