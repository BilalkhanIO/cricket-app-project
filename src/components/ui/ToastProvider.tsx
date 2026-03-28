"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  title: string;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (title: string, tone?: ToastTone) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneClasses: Record<ToastTone, string> = {
  success: "border-[#4ae183]/40 bg-[#0d2c1b] text-[#ccffd9]",
  error: "border-[#ff7b7b]/40 bg-[#3b1212] text-[#ffd7d7]",
  info: "border-white/10 bg-[#12324d] text-[#d4e3ff]",
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((title: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [...current, { id, title, tone }]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-3 top-3 z-[100] flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-2 sm:right-4 sm:top-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto border px-4 py-3 shadow-2xl backdrop-blur-sm ${toneClasses[toast.tone]}`}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.18em]">
              {toast.tone === "success" ? "Success" : toast.tone === "error" ? "Error" : "Notice"}
            </p>
            <p className="mt-1 text-sm font-medium">{toast.title}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
