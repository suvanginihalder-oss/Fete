import React from "react";
import { Send, X, Bot, User, Sparkles } from "lucide-react";
import type { ChatMessage } from "../types/index.js";

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  aqi: number;
  band: string;
  members: string[];
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  city,
  aqi,
  band,
  members,
}) => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "init-1",
      sender: "assistant",
      content: `Hello! I am your AirWise AI smog assistant. Current air in ${city} is ${band} (AQI ${aqi}). Ask me anything about creating clean-air rooms, commuting safely, or protecting your kids and elders.`,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const suggestedQuestions = [
    "Should my children attend morning sports in this air?",
    "How do I build a cheap DIY HEPA fan filter at home?",
    "Do indoor houseplants actually filter PM2.5 smog?",
    "When is the safest 2-hour window today to open windows?",
  ];

  const handleSend = async (questionText?: string) => {
    const textToSend = questionText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      content: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend.trim(),
          city,
          aqi,
          band,
          members,
        }),
      });

      if (!res.ok) {
        throw new Error(`Chat API error: status ${res.status}`);
      }

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: "assistant",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isFallback: data.isFallback,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-err-${Date.now()}`,
          sender: "assistant",
          content: `During ${band} air conditions in ${city}, keep windows closed, avoid outdoor exercise during morning inversions, and wear an N95 respirator outside. General guidance, not medical advice.`,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isFallback: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-title"
      className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-sm"
    >
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div className="p-4 bg-emerald-800 text-white flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-300" aria-hidden="true" />
            <div>
              <h2 id="chat-title" className="font-bold text-sm">
                AirWise AI Smog Assistant
              </h2>
              <div className="text-[11px] text-emerald-200">
                Ground context: {city} • AQI {aqi} ({band})
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-emerald-700 text-white focus:ring-2 focus:ring-white focus:outline-none"
            aria-label="Close chat drawer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Message History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-2 ${m.sender === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                  m.sender === "user"
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-800"
                }`}
              >
                {m.sender === "user" ? (
                  <User className="w-3.5 h-3.5" />
                ) : (
                  <Bot className="w-3.5 h-3.5" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
                  m.sender === "user"
                    ? "bg-emerald-600 text-white rounded-tr-none"
                    : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                }`}
              >
                <div>{m.content}</div>
                <div
                  className={`text-[9px] mt-1 font-mono ${
                    m.sender === "user" ? "text-emerald-200" : "text-slate-400"
                  }`}
                >
                  {m.timestamp}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Bot className="w-4 h-4 animate-spin" />
              <span>AirWise is thinking...</span>
            </div>
          )}
        </div>

        {/* Suggested Prompts */}
        <div className="p-3 bg-white border-t border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Suggested Prompts
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                className="text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition-colors text-left focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about smog hacks, air purifiers, masks..."
            maxLength={500}
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            aria-label="Your question to AirWise"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors focus:ring-2 focus:ring-emerald-400 focus:outline-none"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
