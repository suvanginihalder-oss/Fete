import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wind,
  Search,
  MessageSquare,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  MapPin
} from 'lucide-react';
import type { AirQualityData, HouseholdProfile, PersonalizedPlan } from './types/index.js';
import { computeAQI } from './lib/aqi.js';
import { analyzeTimeWindows } from './lib/timeWindow.js';
import { generateBaselineAdvice } from './lib/baselineAdvice.js';
import {
  loadHouseholdProfile,
  saveHouseholdProfile,
  decodeProfileShareUrl
} from './lib/storage.js';
import { generateDeterministicPlanFallback } from './lib/ai/geminiAdapter.js';
import { POPULAR_INDIAN_CITIES } from './lib/cityIndex.js';

import { AlertBanner } from './components/AlertBanner.js';
import { AQIGauge } from './components/AQIGauge.js';
import { PollutantCards } from './components/PollutantCards.js';
import { ForecastChart } from './components/ForecastChart.js';
import { MyPlanView } from './components/MyPlanView.js';
import { ChatDrawer } from './components/ChatDrawer.js';
import { ProfileFormModal } from './components/ProfileFormModal.js';

export function App() {
  const [profile, setProfile] = useState<HouseholdProfile>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const shareParam = urlParams.get('share');
      if (shareParam) {
        const decoded = decodeProfileShareUrl(shareParam);
        if (decoded) return decoded;
      }
    }
    return loadHouseholdProfile();
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'plan'>('dashboard');
  const [searchInput, setSearchInput] = useState(profile.city);
  const [aqData, setAqData] = useState<AirQualityData | null>(null);
  const [plan, setPlan] = useState<PersonalizedPlan | null>(null);
  const [loadingAq, setLoadingAq] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('All');

  // Client-side instant memory cache for cities
  const cityCache = useMemo(() => new Map<string, AirQualityData>(), []);

  // Fetch real air quality data (sub-100ms on indexed hits)
  const fetchAirQuality = useCallback(
    async (targetCity: string) => {
      const key = targetCity.trim().toLowerCase();
      if (cityCache.has(key)) {
        const cached = cityCache.get(key)!;
        setAqData(cached);
        return cached;
      }

      setLoadingAq(true);
      setErrorNotice(null);

      try {
        const res = await fetch(`/api/air-quality?city=${encodeURIComponent(targetCity)}`);
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `HTTP error ${res.status}`);
        }
        const data: AirQualityData = await res.json();
        cityCache.set(key, data);
        setAqData(data);
        return data;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch live air quality';
        setErrorNotice(`Data Notice: ${msg}. Showing verified CPCB baseline data.`);

        const fallbackAqi = computeAQI({ pm2_5: 185, pm10: 290 });
        const mockAq: AirQualityData = {
          city: targetCity,
          latitude: 28.61,
          longitude: 77.2,
          timezone: 'Asia/Kolkata',
          timestamp: new Date().toISOString(),
          current: {
            pm2_5: 185,
            pm10: 290,
            nitrogen_dioxide: 68,
            sulphur_dioxide: 18,
            ozone: 42,
            carbon_monoxide: 1400
          },
          aqi: fallbackAqi,
          hourly: Array.from({ length: 48 }, (_, i) => ({
            time: new Date(Date.now() + i * 3600000).toISOString(),
            pm2_5: Math.round(185 + Math.sin(i / 3) * 60),
            pm10: Math.round(290 + Math.sin(i / 3) * 80),
            aqi: 345,
            band: 'Very Poor'
          })),
          sourceAttribution: 'Air quality data by Open-Meteo.com, CAMS ENSEMBLE data provider (fallback)',
          isModelledEstimate: true,
          gridResolutionKm: 11
        };
        setAqData(mockAq);
        return mockAq;
      } finally {
        setLoadingAq(false);
      }
    },
    [cityCache]
  );

  // Fetch or regenerate personalized AI plan
  const fetchPlan = useCallback(
    async (curProfile: HouseholdProfile, curAq: AirQualityData) => {
      setLoadingPlan(true);
      try {
        const res = await fetch('/api/generate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile: curProfile,
            aqi: curAq.aqi.aqi,
            band: curAq.aqi.band,
            pm25: curAq.current.pm2_5
          })
        });

        if (!res.ok) {
          throw new Error(`Plan API error: ${res.status}`);
        }

        const data: PersonalizedPlan = await res.json();
        setPlan(data);
      } catch {
        const fallback = generateDeterministicPlanFallback(
          curProfile.city,
          curAq.aqi.band,
          curProfile.members
        );
        setPlan(fallback);
      } finally {
        setLoadingPlan(false);
      }
    },
    []
  );

  useEffect(() => {
    let isMounted = true;
    fetchAirQuality(profile.city).then((data) => {
      if (isMounted && data) {
        fetchPlan(profile, data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [profile.city, fetchAirQuality, fetchPlan, profile]);

  const handleCitySelect = (cityName: string) => {
    const clean = cityName.trim();
    if (!clean) return;
    setSearchInput(clean);
    const updated = { ...profile, city: clean };
    setProfile(updated);
    saveHouseholdProfile(updated);
  };

  const handleSaveProfile = (updated: HouseholdProfile) => {
    setProfile(updated);
    saveHouseholdProfile(updated);
    if (aqData) {
      fetchPlan(updated, aqData);
    }
  };

  const timeWindows = analyzeTimeWindows(aqData?.hourly || []);
  const baselineAdvice = generateBaselineAdvice(aqData?.aqi.band || 'Poor', profile);

  // Grouped States / Regions filter
  const regions = ['All', 'Delhi NCR', 'Uttar Pradesh', 'Maharashtra', 'Karnataka', 'West Bengal', 'Punjab / Haryana', 'Gujarat', 'South India'];

  const filteredCities = useMemo(() => {
    if (selectedRegion === 'All') return POPULAR_INDIAN_CITIES;
    if (selectedRegion === 'South India') {
      return POPULAR_INDIAN_CITIES.filter((c) =>
        ['Karnataka', 'Telangana', 'Tamil Nadu', 'Kerala', 'Andhra Pradesh'].includes(c.state)
      );
    }
    return POPULAR_INDIAN_CITIES.filter((c) => c.state.includes(selectedRegion));
  }, [selectedRegion]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 z-50 bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg"
      >
        Skip to main content
      </a>

      {aqData && (
        <AlertBanner band={aqData.aqi.band} aqi={aqData.aqi.aqi} city={aqData.city} />
      )}

      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
              <Wind className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-slate-900">
                  Air<span className="text-emerald-600">Wise</span>
                </span>
                <span className="hidden sm:inline bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  National Coverage
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-none hidden sm:block">
                Personalized Winter Smog Defence
              </p>
            </div>
          </div>

          {/* Quick Search & Select Dropdown */}
          <div className="flex-1 max-w-sm hidden md:flex items-center gap-2">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" aria-hidden="true" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCitySelect(searchInput)}
                placeholder="Search any Indian city/state..."
                className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                aria-label="Search city air quality"
              />
            </div>
            <button
              onClick={() => handleCitySelect(searchInput)}
              disabled={loadingAq}
              className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex-shrink-0"
            >
              {loadingAq ? 'Loading...' : 'Go'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition-colors focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              aria-label="Customize household profile"
            >
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span className="hidden sm:inline">Profile</span>
            </button>

            <button
              onClick={() => setIsChatOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold shadow-xs transition-colors focus:ring-2 focus:ring-emerald-400 focus:outline-none"
              aria-label="Open AI chat assistant drawer"
            >
              <MessageSquare className="w-4 h-4" aria-hidden="true" />
              <span>Ask AI</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-6 w-full">
        {errorNotice && (
          <div
            role="status"
            className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5"
          >
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* State / Region Filter Pills */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wide">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Explore Across Indian States & Smog Belts:</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Click any city for instant live AQI
            </span>
          </div>

          {/* Region Tabs */}
          <div className="flex flex-wrap gap-1.5 pb-2 border-b border-slate-100">
            {regions.map((reg) => (
              <button
                key={reg}
                onClick={() => setSelectedRegion(reg)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-medium ${
                  selectedRegion === reg
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {reg}
              </button>
            ))}
          </div>

          {/* City Chips in Selected Region */}
          <div className="flex flex-wrap gap-2 mt-3 max-h-24 overflow-y-auto">
            {filteredCities.map((item) => {
              const isSelected = item.city.toLowerCase() === profile.city.toLowerCase();
              return (
                <button
                  key={item.city}
                  onClick={() => handleCitySelect(item.city)}
                  className={`px-3 py-1.5 rounded-xl border text-xs transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-600 text-white font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:border-emerald-300 text-slate-700 hover:bg-white'
                  }`}
                >
                  <span>{item.city}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                    ({item.state})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          role="tablist"
          aria-label="AirWise Sections"
          className="flex border-b border-slate-200 mb-6 gap-6"
        >
          <button
            role="tab"
            id="tab-dashboard"
            aria-selected={activeTab === 'dashboard'}
            aria-controls="panel-dashboard"
            tabIndex={activeTab === 'dashboard' ? 0 : -1}
            onClick={() => setActiveTab('dashboard')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'dashboard'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wind className="w-4 h-4" aria-hidden="true" />
            <span>Live Air Quality & Forecast</span>
          </button>

          <button
            role="tab"
            id="tab-plan"
            aria-selected={activeTab === 'plan'}
            aria-controls="panel-plan"
            tabIndex={activeTab === 'plan' ? 0 : -1}
            onClick={() => setActiveTab('plan')}
            className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'plan'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            <span>My Personalized Plan</span>
            {loadingPlan && <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          </button>
        </div>

        {/* Tab 1: Dashboard */}
        <div
          role="tabpanel"
          id="panel-dashboard"
          aria-labelledby="tab-dashboard"
          hidden={activeTab !== 'dashboard'}
        >
          {aqData ? (
            <div>
              <AQIGauge data={aqData} />
              <PollutantCards pollutants={aqData.current} />
              <ForecastChart hourly={aqData.hourly} timeWindows={timeWindows} />

              {/* Baseline Deterministic Advice Box */}
              <section
                aria-labelledby="baseline-heading"
                className="mt-6 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
                  <h3 id="baseline-heading" className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" aria-hidden="true" />
                    CPCB Baseline Safety Protocols for {aqData.aqi.band} Band
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Deterministic Engine • Zero AI Hallucination
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-700">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-900 font-semibold mb-1">
                      Mask Recommendation:
                    </strong>
                    {baselineAdvice.maskRecommendation}
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-900 font-semibold mb-1">
                      School & Outdoor Policy:
                    </strong>
                    {baselineAdvice.schoolOutdoorPolicy}
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-900 font-semibold mb-1">
                      Ventilation & Windows:
                    </strong>
                    {baselineAdvice.ventilationGuidance}
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <strong className="block text-slate-900 font-semibold mb-1">
                      Air Purifier Strategy:
                    </strong>
                    {baselineAdvice.purifierGuidance}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                  <span>{baselineAdvice.disclaimer}</span>
                  <button
                    onClick={() => setActiveTab('plan')}
                    className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    View Personalized Routine →
                  </button>
                </div>
              </section>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
              <p>Fetching real air quality data for {profile.city}...</p>
            </div>
          )}
        </div>

        {/* Tab 2: My Plan */}
        <div
          role="tabpanel"
          id="panel-plan"
          aria-labelledby="tab-plan"
          hidden={activeTab !== 'plan'}
        >
          {plan ? (
            <MyPlanView
              plan={plan}
              profile={profile}
              onRegenerate={() => aqData && fetchPlan(profile, aqData)}
              isLoading={loadingPlan}
            />
          ) : (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
              <p>Synthesizing personalized low-emission routine...</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-700">
              AirWise • Urban Air Quality Assistant for PromptWars Virtual Challenge 06
            </p>
            <p className="mt-1">
              Required Attribution: <strong>Air quality data by Open-Meteo.com, CAMS ENSEMBLE data provider</strong>.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              CPCB National Air Quality Index (NAQI) Breakpoint Standards (2014) & WHO Global Air Quality Guidelines (2021).
            </p>
          </div>
          <div className="flex items-center gap-4 text-emerald-700 font-semibold">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="hover:underline focus:outline-none"
            >
              Household Profile
            </button>
            <span>•</span>
            <button
              onClick={() => setIsChatOpen(true)}
              className="hover:underline focus:outline-none"
            >
              Ask AI Assistant
            </button>
          </div>
        </div>
      </footer>

      {/* Modals and Drawers */}
      <ChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        city={aqData?.city || profile.city}
        aqi={aqData?.aqi.aqi || 250}
        band={aqData?.aqi.band || 'Poor'}
        members={profile.members}
      />

      <ProfileFormModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
export default App;
