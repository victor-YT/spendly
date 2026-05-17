"use client";

import { useEffect, useState } from "react";

export type Toast = {
  id: number;
  message: string;
  tone: "success" | "error";
};

type ToastViewportProps = {
  toasts: Toast[];
  onDismiss: (id: number) => void;
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: number) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enterTimer = window.setTimeout(() => setVisible(true), 20);
    const exitTimer = window.setTimeout(() => setVisible(false), 2300);
    const dismissTimer = window.setTimeout(() => onDismiss(toast.id), 2600);

    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [onDismiss, toast.id]);

  const toneClasses =
    toast.tone === "success"
      ? "border-emerald-200 bg-emerald-50/95 text-emerald-950"
      : "border-rose-200 bg-rose-50/95 text-rose-950";

  const accentClasses =
    toast.tone === "success" ? "bg-emerald-500" : "bg-rose-500";

  return (
    <div
      className={`pointer-events-auto overflow-hidden rounded-2xl border shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur transition-all duration-300 ${toneClasses} ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div className={`mt-1 h-2.5 w-2.5 rounded-full ${accentClasses}`} />
        <p className="flex-1 text-sm font-medium">{toast.message}</p>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="cursor-pointer rounded-full px-2 py-1 text-xs font-medium text-slate-500 transition-all duration-200 hover:scale-105 hover:bg-white/70 hover:text-slate-900 active:scale-95"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function ToastViewport({
  toasts,
  onDismiss,
}: ToastViewportProps) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
