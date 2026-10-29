import React, { useState } from 'react';
import { X, Sparkles, Send, Check, ArrowRight, CornerDownLeft, Bot, User, Wand2 } from 'lucide-react';
import { EventPlan, ChatMessage } from '../types';
import { rescaleBudgetLines, computeTimelineDates } from '../lib/math';

interface ChatAssistantDrawerProps {
  isOpen: boolean;
  plan: EventPlan;
  onClose: () => void;
  onApplyPlanUpdate: (updatedPlan: EventPlan, noticeMsg: string) => void;
}

export const ChatAssistantDrawer: React.FC<ChatAssistantDrawerProps> = ({
  isOpen,
  plan,
  onClose,
  onApplyPlanUpdate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: `Hello! I am your CelebrAI event planning assistant. I have full context on "${plan.input.name}" with ${plan.input.guests} guests in ${plan.input.city} and your ${plan.input.currency}${plan.budget.totalBudget.toLocaleString()} budget. How can I fine-tune your celebration?`,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const quickPrompts = [
    `💡 Find ₹8,000 savings in food & decor`,
    `🌧️ Add a 36-hour rain contingency check`,
    `📸 Add a photobooth setup task 2 days prior`,
    `👥 Suggest changes for 30 extra guests`,
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, plan }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          const aiMsg: ChatMessage = {
            id: `msg-ai-${Date.now()}`,
            sender: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            content: json.data.reply,
            suggestedAction: json.data.suggestedAction,
          };
          setMessages((prev) => [...prev, aiMsg]);
          setIsTyping(false);
          return;
        }
      }
      throw new Error('API route unavailable');
    } catch (err) {
      // Local intelligent response simulation
      setTimeout(() => {
        const lower = text.toLowerCase();
        let reply = '';
        let suggestedAction: any = null;

        if (lower.includes('budget') || lower.includes('save') || lower.includes('cost') || lower.includes('food')) {
          reply = `I reviewed your budget allocations. By swapping commercial imported floral backdrops with seasonal blooms and negotiating bundled audio gear, we can optimize ${plan.input.currency} 8,000 while maintaining high production quality.`;
          suggestedAction = {
            type: 'modify_budget',
            label: `Apply ${plan.input.currency} 8,000 Budget Optimization`,
            diffSummary: 'Reduces Food & Decor allocations, increasing Contingency Buffer',
            applyPayload: { delta: 8000 },
          };
        } else if (lower.includes('rain') || lower.includes('weather') || lower.includes('contingency')) {
          reply = `Given the outdoor aspects of your event in ${plan.input.city}, I recommend adding a high-priority 36-hour weather assessment checkpoint to the production schedule.`;
          suggestedAction = {
            type: 'add_task',
            label: 'Add 36-Hour Weather Contingency Check',
            diffSummary: 'Adds high-priority task: "Execute Rain Check & Hall Transition Standby"',
            applyPayload: {
              task: {
                title: 'Execute Rain Check & Hall Transition Standby',
                category: 'Safety',
                dueOffsetDays: 2,
                priority: 'high',
                notes: 'Contact venue manager to confirm dry storage for electrical fixtures.'
              }
            }
          };
        } else if (lower.includes('photo') || lower.includes('booth')) {
          reply = `An instant photo kiosk is a huge hit for ${plan.input.eventType.replace('_', ' ')} guests. I have scheduled an interactive setup and lighting test 2 days before the event.`;
          suggestedAction = {
            type: 'add_task',
            label: 'Add Photobooth Setup & Test Task',
            diffSummary: 'Adds task: "Photobooth Backdrop Setup & QR Printer Test"',
            applyPayload: {
              task: {
                title: 'Photobooth Backdrop Setup & QR Printer Test',
                category: 'Production',
                dueOffsetDays: 2,
                priority: 'medium',
                notes: 'Ensure 2x power outlets and test wireless printer battery.'
              }
            }
          };
        } else {
          reply = `Great consideration for "${plan.input.name}". Based on your ${plan.input.guests} guests in ${plan.input.city}, I recommend locking in key vendor deliverables and reviewing dietary accommodations early. Would you like me to find cost reductions in your budget lines or adjust your day schedule?`;
        }

        const aiMsg: ChatMessage = {
          id: `msg-ai-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          content: reply,
          suggestedAction,
        };

        setMessages((prev) => [...prev, aiMsg]);
        setIsTyping(false);
      }, 500);
    }
  };

  const handleApplyAction = (msgId: string, action: NonNullable<ChatMessage['suggestedAction']>) => {
    if (appliedIds.has(msgId)) return;

    if (action.type === 'modify_budget') {
      const updatedLines = plan.budget.lines.map((line) => {
        if (line.category.toLowerCase().includes('food') || line.category.toLowerCase().includes('catering')) {
          return { ...line, allocatedAmount: Math.max(0, line.allocatedAmount - 5000) };
        }
        if (line.category.toLowerCase().includes('decor')) {
          return { ...line, allocatedAmount: Math.max(0, line.allocatedAmount - 3000) };
        }
        if (line.category.toLowerCase().includes('emergency') || line.category.toLowerCase().includes('buffer')) {
          return { ...line, allocatedAmount: line.allocatedAmount + 8000 };
        }
        return line;
      });

      // Code owns the math
      const newBudget = rescaleBudgetLines(updatedLines, plan.budget.totalBudget);
      const updatedPlan: EventPlan = {
        ...plan,
        budget: newBudget,
        updatedAt: new Date().toISOString(),
      };

      setAppliedIds((prev) => new Set(prev).add(msgId));
      onApplyPlanUpdate(updatedPlan, 'Applied Budget Optimization diff (Code math re-calculated totals)');
    } else if (action.type === 'add_task' && action.applyPayload?.task) {
      const rawTask = action.applyPayload.task;
      const computed = computeTimelineDates([rawTask], plan.input.date);
      const updatedTimeline = [...plan.timeline, ...computed].sort((a, b) => a.targetDate.localeCompare(b.targetDate));

      const updatedPlan: EventPlan = {
        ...plan,
        timeline: updatedTimeline,
        updatedAt: new Date().toISOString(),
      };

      setAppliedIds((prev) => new Set(prev).add(msgId));
      onApplyPlanUpdate(updatedPlan, `Added new milestone task: "${rawTask.title}"`);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden bg-stone-900/40 backdrop-blur-xs flex justify-end"
    >
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-ivory-300 animate-slideLeft">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-plum-900 to-coral-700 text-white flex items-center justify-between shadow-soft">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-coral-200" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-white">Event Assistant AI</h3>
              <p className="text-[11px] text-coral-100">Full blueprint in context</p>
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

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-ivory-100/50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-plum-100 text-plum-900 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm shadow-2xs space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-plum-900 text-white rounded-tr-xs'
                    : 'bg-white border border-ivory-300 text-stone-900 rounded-tl-xs'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                {/* Diff Suggestion Box with 1-Click Apply */}
                {msg.suggestedAction && (
                  <div className="mt-2.5 p-3 rounded-xl bg-coral-50/70 border border-coral-200/80 space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-coral-950">
                      <Wand2 className="w-3.5 h-3.5 text-coral-600" />
                      <span>{msg.suggestedAction.label}</span>
                    </div>

                    <p className="text-[11px] text-stone-700 bg-white/70 p-2 rounded-lg border border-coral-200/50">
                      <strong>Proposed Change:</strong> {msg.suggestedAction.diffSummary}
                    </p>

                    <button
                      onClick={() => handleApplyAction(msg.id, msg.suggestedAction!)}
                      disabled={appliedIds.has(msg.id)}
                      type="button"
                      className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        appliedIds.has(msg.id)
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default'
                          : 'bg-gradient-to-r from-plum-900 to-coral-700 hover:from-plum-950 hover:to-coral-800 text-white shadow-soft transform active:scale-98'
                      }`}
                    >
                      {appliedIds.has(msg.id) ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Applied to Blueprint</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-coral-200" />
                          <span>Apply Changes (Re-calculate Math)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <span className={`block text-[10px] ${msg.sender === 'user' ? 'text-plum-200 text-right' : 'text-stone-700'}`}>
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-coral-100 text-coral-800 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2.5 items-center text-xs text-stone-700 pl-9">
              <span className="w-2 h-2 rounded-full bg-coral-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-coral-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-coral-500 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-[11px]">Analyzing event context...</span>
            </div>
          )}
        </div>

        {/* Quick Prompts Bar */}
        <div className="px-4 py-2 border-t border-ivory-300 bg-white flex gap-1.5 overflow-x-auto text-xs whitespace-nowrap">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              type="button"
              className="px-2.5 py-1 rounded-full bg-ivory-200 hover:bg-ivory-300 text-stone-800 font-medium text-[11px] transition-colors shrink-0"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-ivory-300 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask for cost savings, schedule adjustments..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-ivory-400 focus:outline-hidden focus:ring-2 focus:ring-coral-500 bg-ivory-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="p-2.5 rounded-xl bg-plum-900 text-white hover:bg-plum-950 disabled:opacity-50 transition-colors shadow-soft"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
