import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface ToastProps {
  message: string | null;
  type?: "success" | "error";
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = "success",
  onDismiss,
}) => {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-elevated text-xs sm:text-sm font-semibold transition-all transform animate-bounce-short border"
      style={{
        backgroundColor: type === "success" ? "#4A154B" : "#881337",
        color: "#FFFFFF",
        borderColor: type === "success" ? "#7E22CE" : "#E11D48",
      }}
    >
      {type === "success" ? (
        <CheckCircle2 className="w-4 h-4 text-coral-300 shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
      )}
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="ml-2 text-white/70 hover:text-white font-bold"
        aria-label="Dismiss toast"
      >
        ✕
      </button>
    </div>
  );
};
