"use client";

import { useEffect, useRef, useState } from "react";
import type { ExpensePayload } from "@/lib/expense-utils";
import {
  EXPENSE_CATEGORIES,
  getExpenseFieldErrors,
  validateExpensePayload,
} from "@/lib/expense-utils";

type ExpenseFormProps = {
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onCreate: (
    payload: ExpensePayload
  ) => Promise<{ success: true } | { success: false; message: string }>;
};

type ExpenseFormState = {
  title: string;
  category: string;
  amount: string;
  date: string;
  description: string;
};

function createInitialFormState(): ExpenseFormState {
  return {
    title: "",
    category: EXPENSE_CATEGORIES[0],
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
  };
}

export default function ExpenseForm({
  open,
  isSubmitting,
  onClose,
  onCreate,
}: ExpenseFormProps) {
  const [form, setForm] = useState<ExpenseFormState>(createInitialFormState);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      titleInputRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const nextFieldErrors = getExpenseFieldErrors({
      ...form,
      amount: Number(form.amount),
    });
    setFieldErrors(nextFieldErrors);

    if (Object.keys(nextFieldErrors).length > 0) {
      return;
    }

    const validation = validateExpensePayload({
      ...form,
      amount: Number(form.amount),
    });

    if (!validation.success) {
      setError(validation.message);
      return;
    }

    const result = await onCreate(validation.data);

    if (!result.success) {
      setError(result.message);
    }
  }

  function updateField<Key extends keyof ExpenseFormState>(
    key: Key,
    value: ExpenseFormState[Key]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[key];
      return nextErrors;
    });
  }

  function inputClass(hasError: boolean) {
    return `block w-full min-w-0 rounded-xl border bg-white px-4 py-3 text-slate-950 outline-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-100 ${
      hasError ? "border-rose-300" : "border-slate-200 focus:border-blue-500"
    }`;
  }

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center px-4 transition-all duration-200 ${
        open
          ? "bg-slate-950/40 opacity-100 backdrop-blur-sm"
          : "pointer-events-none bg-slate-950/0 opacity-0 backdrop-blur-none"
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-expense-title"
        className={`w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_28px_90px_rgba(15,23,42,0.18)] transition-all duration-200 ${
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-4 scale-[0.98] opacity-0"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2
            id="add-expense-title"
            className="text-xl font-semibold tracking-tight text-slate-950"
          >
            Add Expense
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add expense dialog"
            className="inline-flex cursor-pointer items-center justify-center rounded-lg px-2.5 py-2 text-sm text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-950 active:scale-[0.98]"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <label className="grid min-w-0 gap-2">
            <span className="text-sm font-medium text-slate-700">Title</span>
            <input
              ref={titleInputRef}
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder="Groceries"
              className={inputClass(Boolean(fieldErrors.title))}
            />
            <span className="min-h-[1.25rem] text-sm text-rose-600">
              {fieldErrors.title ?? ""}
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid min-w-0 gap-2">
              <span className="text-sm font-medium text-slate-700">Category</span>
              <select
                value={form.category}
                onChange={(event) => updateField("category", event.target.value)}
                className={inputClass(Boolean(fieldErrors.category))}
              >
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <span className="min-h-[1.25rem] text-sm text-rose-600">
                {fieldErrors.category ?? ""}
              </span>
            </label>

            <label className="grid min-w-0 gap-2">
              <span className="text-sm font-medium text-slate-700">Amount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={form.amount}
                onChange={(event) => updateField("amount", event.target.value)}
                placeholder="0.00"
                className={`${inputClass(Boolean(fieldErrors.amount))} appearance-none pr-4`}
              />
              <span className="min-h-[1.25rem] text-sm text-rose-600">
                {fieldErrors.amount ?? ""}
              </span>
            </label>
          </div>

          <label className="grid min-w-0 gap-2">
            <span className="text-sm font-medium text-slate-700">Date</span>
            <input
              type="date"
              value={form.date}
              onChange={(event) => updateField("date", event.target.value)}
              className={inputClass(Boolean(fieldErrors.date))}
            />
            <span className="min-h-[1.25rem] text-sm text-rose-600">
              {fieldErrors.date ?? ""}
            </span>
          </label>

          <label className="grid min-w-0 gap-2">
            <span className="text-sm font-medium text-slate-700">
              Description
            </span>
            <textarea
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              rows={4}
              placeholder="Optional note"
              className={`${inputClass(Boolean(fieldErrors.description))} resize-none`}
            />
            <span className="min-h-[1.25rem] text-sm text-rose-600">
              {fieldErrors.description ?? ""}
            </span>
          </label>

          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 active:scale-[0.98]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
