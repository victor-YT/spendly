"use client";

import { useEffect, useRef } from "react";
import { LogOut, X } from "lucide-react";
import UserAvatar from "@/app/components/UserAvatar";

type UserProfilePanelUser = {
  name?: string | null;
  email?: string | null;
  role: "user" | "admin";
};

type UserProfilePanelProps = {
  open: boolean;
  user: UserProfilePanelUser;
  onClose: () => void;
  onLogout: () => void | Promise<void>;
};

export default function UserProfilePanel({
  open,
  user,
  onClose,
  onLogout,
}: UserProfilePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const displayName = user.name?.trim() || user.email?.trim() || "User";
  const displayEmail = user.email?.trim() || "No email available";
  const roleLabel = user.role === "admin" ? "Admin" : "User";
  const accountLabel = `${roleLabel} account`;

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "Tab" && panelRef.current) {
        const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) {
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-4 transition-all duration-200 ${
        open
          ? "bg-slate-950/35 opacity-100 backdrop-blur-sm"
          : "pointer-events-none bg-slate-950/0 opacity-0 backdrop-blur-none"
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        className={`w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.18)] transition-all duration-200 ${
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-3 scale-[0.98] opacity-0"
        }`}
      >
        <div className="flex justify-end">
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close profile"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100 active:scale-[0.98]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <UserAvatar name={user.name} email={user.email} size="lg" />
          <h2
            id="profile-title"
            className="mt-5 max-w-full truncate text-xl font-semibold text-slate-950"
          >
            {displayName}
          </h2>
          <p className="mt-1 max-w-full truncate text-sm font-medium text-slate-500">
            {displayEmail}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {roleLabel}
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {accountLabel}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-6 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100 active:scale-[0.98]"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}
