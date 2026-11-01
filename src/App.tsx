import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Calendar,
  DollarSign,
  Users,
  Briefcase,
  MessageSquare,
} from "lucide-react";

import {
  EventPlan,
  EventFormInput,
  EventType,
  SectionKey,
  SectionStatus,
  BudgetSummary,
  TimelineTask,
  GuestItem,
  VendorItem,
} from "./types";
import {
  getSavedPlans,
  savePlanToStorage,
  getPlanById,
  getActivePlanId,
  setActivePlanId,
  deletePlanFromStorage,
} from "./lib/storage";
import { createSampleCollegeFest } from "./lib/sampleData";
import {
  generateFullParallelPlan,
  fetchSectionWithSingleRetry,
} from "./lib/ai/parallelPlanner";
import { decodePlanFromUrl, triggerPrint } from "./lib/sharing";

import { Navbar } from "./components/Navbar";
import { LandingHero } from "./components/LandingHero";
import { EventFormModal } from "./components/EventFormModal";
import { PlanProgressModal } from "./components/PlanProgressModal";
import { PlanHeader } from "./components/PlanHeader";
import { ConceptTab } from "./components/tabs/ConceptTab";
import { BudgetTab } from "./components/tabs/BudgetTab";
import { TimelineTab } from "./components/tabs/TimelineTab";
import { GuestTrackerTab } from "./components/tabs/GuestTrackerTab";
import { VendorsTab } from "./components/tabs/VendorsTab";
import { InvitationsTab } from "./components/tabs/InvitationsTab";
import { ChatAssistantDrawer } from "./components/ChatAssistantDrawer";
import { SavedPlansDrawer } from "./components/SavedPlansDrawer";
import { Toast } from "./components/Toast";

type TabKey = "concept" | "budget" | "timeline" | "vendors" | "guests" | "invites";

const TAB_ORDER: TabKey[] = [
  "concept",
  "budget",
  "timeline",
  "vendors",
  "guests",
  "invites",
];

/**
 * Main application component coordinating navigation, AI plan generation,
 * state persistence, and accessible tab views.
 */
export function App() {
  const [plans, setPlans] = useState<EventPlan[]>([]);
  const [activePlan, setActivePlan] = useState<EventPlan | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("concept");

  // Modals & Drawers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formInitialType, setFormInitialType] = useState<EventType>("wedding");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationEventName, setGenerationEventName] = useState("");
  const [sectionStates, setSectionStates] = useState<
    Record<SectionKey, SectionStatus>
  >({
    concept: { loading: false, completed: false, retrying: false },
    budget: { loading: false, completed: false, retrying: false },
    timeline: { loading: false, completed: false, retrying: false },
    vendors: { loading: false, completed: false, retrying: false },
  });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);

  // Initialize from storage or shared URL
  useEffect(() => {
    // 1. Check URL for shared read-only plan
    const params = new URLSearchParams(window.location.search);
    const sharedHash = params.get("share");
    if (sharedHash) {
      const decoded = decodePlanFromUrl(sharedHash);
      if (decoded) {
        setActivePlan(decoded);
        setIsReadOnly(true);
        showToast("Viewing shared read-only event blueprint");
        return;
      }
    }

    // 2. Load from localStorage
    const saved = getSavedPlans();
    setPlans(saved);

    const activeId = getActivePlanId();
    if (activeId) {
      const found = getPlanById(activeId);
      if (found) {
        setActivePlan(found);
      } else if (saved.length > 0) {
        setActivePlan(saved[0]);
      }
    } else if (saved.length > 0) {
      setActivePlan(saved[0]);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  /**
   * Fires confetti with reduced motion fallback for accessibility compliance.
   */
  const fireCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#4A154B", "#FF6B6B", "#F59E0B", "#10B981"],
        disableForReducedMotion: true,
      });
    } catch {
      // Safe fallback if canvas is unsupported
    }
  };

  // Load College Cultural Fest Sample
  const handleLoadSample = () => {
    const sample = createSampleCollegeFest();
    savePlanToStorage(sample);
    setPlans(getSavedPlans());
    setActivePlan(sample);
    setActiveTab("concept");
    setIsReadOnly(false);
    fireCelebration();
    showToast("Loaded Aura '26 College Cultural Fest sample!");
  };

  // Start new event modal
  const handleOpenNewEvent = (type: EventType = "wedding") => {
    setFormInitialType(type);
    setIsFormOpen(true);
  };

  // Handle Form Submission -> Parallel AI generation
  const handleFormSubmit = async (input: EventFormInput) => {
    setIsFormOpen(false);
    setGenerationEventName(input.name);
    setIsGenerating(true);

    // Reset section statuses
    setSectionStates({
      concept: { loading: true, completed: false, retrying: false },
      budget: { loading: true, completed: false, retrying: false },
      timeline: { loading: true, completed: false, retrying: false },
      vendors: { loading: true, completed: false, retrying: false },
    });

    try {
      const fullPlan = await generateFullParallelPlan(input, {
        onSectionStart: (sec) => {
          setSectionStates((prev) => ({
            ...prev,
            [sec]: { loading: true, completed: false, retrying: false },
          }));
        },
        onSectionSuccess: (sec) => {
          setSectionStates((prev) => ({
            ...prev,
            [sec]: { loading: false, completed: true, retrying: false },
          }));
        },
        onSectionError: (sec, err) => {
          setSectionStates((prev) => ({
            ...prev,
            [sec]: {
              loading: false,
              completed: false,
              error: err,
              retrying: false,
            },
          }));
        },
      });

      // Save plan and activate
      savePlanToStorage(fullPlan);
      setPlans(getSavedPlans());
      setActivePlan(fullPlan);
      setActiveTab("concept");
      setIsGenerating(false);
      setIsReadOnly(false);
      fireCelebration();
      showToast(`Blueprint generated for "${fullPlan.input.name}"!`);
    } catch {
      setIsGenerating(false);
      showToast("Plan generation experienced an issue; loading sample plan");
      handleLoadSample();
    }
  };

  // Section retry handler
  const handleRetrySection = async (section: SectionKey) => {
    if (!activePlan) return;
    setSectionStates((prev) => ({
      ...prev,
      [section]: { loading: true, completed: false, retrying: true },
    }));

    try {
      await fetchSectionWithSingleRetry(section, activePlan.input, {
        onSectionStart: () => { },
        onSectionSuccess: () => {
          setSectionStates((prev) => ({
            ...prev,
            [section]: { loading: false, completed: true, retrying: false },
          }));
          showToast(`Section ${section} updated!`);
        },
        onSectionError: (sec, err) => {
          setSectionStates((prev) => ({
            ...prev,
            [sec]: {
              loading: false,
              completed: false,
              error: err,
              retrying: false,
            },
          }));
        },
      });
    } catch {
      showToast("Section retry completed");
    }
  };

  // State Updates from Tabs
  const handleUpdateBudget = (newBudget: BudgetSummary) => {
    if (!activePlan || isReadOnly) return;
    const updated: EventPlan = {
      ...activePlan,
      budget: newBudget,
      updatedAt: new Date().toISOString(),
    };
    setActivePlan(updated);
    savePlanToStorage(updated);
  };

  const handleUpdateTimeline = (newTasks: TimelineTask[]) => {
    if (!activePlan || isReadOnly) return;
    const updated: EventPlan = {
      ...activePlan,
      timeline: newTasks,
      updatedAt: new Date().toISOString(),
    };
    setActivePlan(updated);
    savePlanToStorage(updated);
  };

  const handleUpdateGuests = (newGuests: GuestItem[]) => {
    if (!activePlan || isReadOnly) return;
    const updated: EventPlan = {
      ...activePlan,
      guests: newGuests,
      updatedAt: new Date().toISOString(),
    };
    setActivePlan(updated);
    savePlanToStorage(updated);
    showToast("Guest roster updated");
  };

  const handleUpdateVendors = (newVendors: VendorItem[]) => {
    if (!activePlan || isReadOnly) return;
    const updated: EventPlan = {
      ...activePlan,
      vendors: newVendors,
      updatedAt: new Date().toISOString(),
    };
    setActivePlan(updated);
    savePlanToStorage(updated);
    showToast("Vendor status saved");
  };

  // AI Chat diff applied
  const handleApplyChatUpdate = (updatedPlan: EventPlan, msg: string) => {
    setActivePlan(updatedPlan);
    savePlanToStorage(updatedPlan);
    fireCelebration();
    showToast(msg);
  };

  const handleDeletePlan = (id: string) => {
    deletePlanFromStorage(id);
    const updated = getSavedPlans();
    setPlans(updated);
    if (activePlan?.id === id) {
      setActivePlan(updated.length > 0 ? updated[0] : null);
    }
    showToast("Event deleted");
  };

  /**
   * Accessible roving keyboard navigation for tabs (WCAG 2.1 AA)
   */
  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    let nextIndex = currentIndex;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % TAB_ORDER.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + TAB_ORDER.length) % TAB_ORDER.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = TAB_ORDER.length - 1;
    } else {
      return;
    }

    e.preventDefault();
    const nextTab = TAB_ORDER[nextIndex];
    setActiveTab(nextTab);
    const nextElement = document.getElementById(`tab-${nextTab}`);
    nextElement?.focus();
  };

  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col font-sans">
      {/* Accessible Skip Link */}
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      {/* Navigation */}
      <Navbar
        activePlan={activePlan}
        savedPlansCount={plans.length}
        onOpenNewEvent={() => handleOpenNewEvent()}
        onLoadSample={handleLoadSample}
        onOpenSavedPlans={() => setIsSavedDrawerOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        isReadOnly={isReadOnly}
      />

      {/* Main Landmark Container */}
      <main id="main" tabIndex={-1} className="flex-1 pb-16 outline-none">
        {activePlan ? (
          <div>
            {/* Header with Title & Action toolbar */}
            <PlanHeader
              plan={activePlan}
              onOpenChat={() => setIsChatOpen(true)}
              onOpenShare={() => setActiveTab("invites")}
              onPrint={triggerPrint}
              onExport={() => setActiveTab("invites")}
              onEdit={() => setIsFormOpen(true)}
              isReadOnly={isReadOnly}
            />

            {/* Tab Navigation Pill Bar with Full ARIA tablist */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
              <div
                role="tablist"
                aria-label="Event blueprint sections"
                className="flex items-center gap-1.5 p-1.5 bg-ivory-200/80 backdrop-blur-xs rounded-2xl border border-ivory-300 overflow-x-auto"
              >
                <button
                  id="tab-concept"
                  role="tab"
                  aria-selected={activeTab === "concept"}
                  aria-controls="panel-concept"
                  tabIndex={activeTab === "concept" ? 0 : -1}
                  onKeyDown={(e) => handleTabKeyDown(e, 0)}
                  onClick={() => setActiveTab("concept")}
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 focus-visible:outline-none ${activeTab === "concept"
                      ? "bg-plum-900 text-white shadow-soft"
                      : "text-stone-700 hover:text-plum-950 hover:bg-ivory-300/60"
                    }`}
                >
                  <Sparkles className="w-4 h-4 text-coral-400" aria-hidden="true" />
                  <span>Concept & Theme</span>
                </button>

                <button
                  id="tab-budget"
                  role="tab"
                  aria-selected={activeTab === "budget"}
                  aria-controls="panel-budget"
                  tabIndex={activeTab === "budget" ? 0 : -1}
                  onKeyDown={(e) => handleTabKeyDown(e, 1)}
                  onClick={() => setActiveTab("budget")}
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 focus-visible:outline-none ${activeTab === "budget"
                      ? "bg-plum-900 text-white shadow-soft"
                      : "text-stone-700 hover:text-plum-950 hover:bg-ivory-300/60"
                    }`}
                >
                  <DollarSign className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  <span>Budget & What-If</span>
                  {activePlan.budget.isOverBudget && (
                    <>
                      <span className="w-2 h-2 rounded-full bg-rose-500" aria-hidden="true" />
                      <span className="sr-only">(Budget exceeded warning)</span>
                    </>
                  )}
                </button>

                <button
                  id="tab-timeline"
                  role="tab"
                  aria-selected={activeTab === "timeline"}
                  aria-controls="panel-timeline"
                  tabIndex={activeTab === "timeline" ? 0 : -1}
                  onKeyDown={(e) => handleTabKeyDown(e, 2)}
                  onClick={() => setActiveTab("timeline")}
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 focus-visible:outline-none ${activeTab === "timeline"
                      ? "bg-plum-900 text-white shadow-soft"
                      : "text-stone-700 hover:text-plum-950 hover:bg-ivory-300/60"
                    }`}
                >
                  <Calendar className="w-4 h-4 text-purple-400" aria-hidden="true" />
                  <span>Timeline & Schedule</span>
                </button>

                <button
                  id="tab-vendors"
                  role="tab"
                  aria-selected={activeTab === "vendors"}
                  aria-controls="panel-vendors"
                  tabIndex={activeTab === "vendors" ? 0 : -1}
                  onKeyDown={(e) => handleTabKeyDown(e, 3)}
                  onClick={() => setActiveTab("vendors")}
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 focus-visible:outline-none ${activeTab === "vendors"
                      ? "bg-plum-900 text-white shadow-soft"
                      : "text-stone-700 hover:text-plum-950 hover:bg-ivory-300/60"
                    }`}
                >
                  <Briefcase className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span>Vendors & Plan B</span>
                </button>

                <button
                  id="tab-guests"
                  role="tab"
                  aria-selected={activeTab === "guests"}
                  aria-controls="panel-guests"
                  tabIndex={activeTab === "guests" ? 0 : -1}
                  onKeyDown={(e) => handleTabKeyDown(e, 4)}
                  onClick={() => setActiveTab("guests")}
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 focus-visible:outline-none ${activeTab === "guests"
                      ? "bg-plum-900 text-white shadow-soft"
                      : "text-stone-700 hover:text-plum-950 hover:bg-ivory-300/60"
                    }`}
                >
                  <Users className="w-4 h-4 text-blue-400" aria-hidden="true" />
                  <span>RSVP & Guests ({activePlan.guests.length})</span>
                </button>

                <button
                  id="tab-invites"
                  role="tab"
                  aria-selected={activeTab === "invites"}
                  aria-controls="panel-invites"
                  tabIndex={activeTab === "invites" ? 0 : -1}
                  onKeyDown={(e) => handleTabKeyDown(e, 5)}
                  onClick={() => setActiveTab("invites")}
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 focus-visible:outline-none ${activeTab === "invites"
                      ? "bg-plum-900 text-white shadow-soft"
                      : "text-stone-700 hover:text-plum-950 hover:bg-ivory-300/60"
                    }`}
                >
                  <MessageSquare className="w-4 h-4 text-coral-400" aria-hidden="true" />
                  <span>Invites & Sharing</span>
                </button>
              </div>

              {/* Active Tab Panel with Landmark & Labelledby */}
              <div
                role="tabpanel"
                id={`panel-${activeTab}`}
                aria-labelledby={`tab-${activeTab}`}
                tabIndex={0}
                className="mt-8 focus:outline-none"
              >
                {activeTab === "concept" && (
                  <ConceptTab
                    concept={activePlan.concept}
                    input={activePlan.input}
                  />
                )}

                {activeTab === "budget" && (
                  <BudgetTab
                    budget={activePlan.budget}
                    currency={activePlan.input.currency}
                    guestsCount={activePlan.input.guests}
                    initialTotalBudget={activePlan.input.budget}
                    onUpdateBudget={handleUpdateBudget}
                    isReadOnly={isReadOnly}
                  />
                )}

                {activeTab === "timeline" && (
                  <TimelineTab
                    timeline={activePlan.timeline}
                    daySchedule={activePlan.daySchedule}
                    eventDate={activePlan.input.date}
                    onUpdateTimeline={handleUpdateTimeline}
                    isReadOnly={isReadOnly}
                  />
                )}

                {activeTab === "vendors" && (
                  <VendorsTab
                    vendors={activePlan.vendors}
                    weatherPlanB={activePlan.weatherPlanB}
                    expertTips={activePlan.expertTips}
                    currency={activePlan.input.currency}
                    onUpdateVendors={handleUpdateVendors}
                    isReadOnly={isReadOnly}
                  />
                )}

                {activeTab === "guests" && (
                  <GuestTrackerTab
                    guests={activePlan.guests}
                    totalBudget={activePlan.budget.totalBudget}
                    expectedGuests={activePlan.input.guests}
                    currency={activePlan.input.currency}
                    onUpdateGuests={handleUpdateGuests}
                    isReadOnly={isReadOnly}
                  />
                )}

                {activeTab === "invites" && (
                  <InvitationsTab
                    plan={activePlan}
                    onImportComplete={() => {
                      setPlans(getSavedPlans());
                      const current = getActivePlanId();
                      if (current) setActivePlan(getPlanById(current));
                    }}
                    onShowToast={showToast}
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Empty / Landing Hero State */
          <LandingHero
            onStartNew={(type) => handleOpenNewEvent(type)}
            onLoadSample={handleLoadSample}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <EventFormModal
        isOpen={isFormOpen}
        initialType={formInitialType}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <PlanProgressModal
        isOpen={isGenerating}
        eventName={generationEventName}
        sectionStates={sectionStates}
        onRetrySection={handleRetrySection}
      />

      {activePlan && (
        <ChatAssistantDrawer
          isOpen={isChatOpen}
          plan={activePlan}
          onClose={() => setIsChatOpen(false)}
          onApplyPlanUpdate={handleApplyChatUpdate}
        />
      )}

      <SavedPlansDrawer
        isOpen={isSavedDrawerOpen}
        plans={plans}
        activePlanId={activePlan?.id || null}
        onClose={() => setIsSavedDrawerOpen(false)}
        onSelectPlan={(p) => {
          setActivePlan(p);
          setActivePlanId(p.id);
          setIsReadOnly(false);
          showToast(`Switched to "${p.input.name}"`);
        }}
        onDeletePlan={handleDeletePlan}
        onNewEvent={() => handleOpenNewEvent()}
        onLoadSample={handleLoadSample}
      />

      {/* Accessible Toast Notification */}
      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}

export default App;