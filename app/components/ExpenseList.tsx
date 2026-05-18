"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bus,
  Car,
  ChevronDown,
  Film,
  HeartPulse,
  Pencil,
  Receipt,
  Search,
  ShoppingBag,
  Trash2,
  Utensils,
} from "lucide-react";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import type { Expense, ExpensePayload } from "@/lib/expense-utils";
import {
  EXPENSE_CATEGORIES,
  formatCurrency,
  getExpenseFieldErrors,
  getTodayDateString,
  validateExpensePayload,
} from "@/lib/expense-utils";

const PANEL_TRANSITION_MS = 220;
const DATE_RANGE_OPTIONS = ["All", "Last 7 days", "Last 30 days", "Last 90 days"];

type ExpenseListProps = {
  expenses: Expense[];
  showOwners?: boolean;
  processingIds: number[];
  onDelete: (
    id: number
  ) => Promise<{ success: true } | { success: false; message: string }>;
  onUpdate: (
    id: number,
    payload: ExpensePayload
  ) => Promise<{ success: true } | { success: false; message: string }>;
};

type EditState = {
  title: string;
  category: string;
  amount: string;
  date: string;
  description: string;
};

function buildEditState(expense: Expense): EditState {
  return {
    title: expense.title,
    category: expense.category,
    amount: String(expense.amount),
    date: expense.date,
    description: expense.description,
  };
}

function getGroupLabel(date: string) {
  const target = new Date(`${date}T00:00:00`);
  const today = new Date();
  const current = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const targetDay = new Date(
    target.getFullYear(),
    target.getMonth(),
    target.getDate()
  );

  const diffDays = Math.round(
    (current.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24)
  );

  const formatted = new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(target);

  if (diffDays === 0) {
    return `${formatted} (Today)`;
  }

  if (diffDays === 1) {
    return `${formatted} (Yesterday)`;
  }

  return formatted;
}

function getCategoryIcon(category: string) {
  switch (category) {
    case "Food":
      return Utensils;
    case "Transport":
      return Bus;
    case "Healthcare":
      return HeartPulse;
    case "Shopping":
      return ShoppingBag;
    case "Entertainment":
      return Film;
    case "Travel":
      return Car;
    default:
      return Receipt;
  }
}

type ExpenseActionsProps = {
  isBusy: boolean;
  isEditingActive: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function ExpenseActions({
  isBusy,
  isEditingActive,
  onEdit,
  onDelete,
}: ExpenseActionsProps) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={onEdit}
        disabled={isBusy}
        aria-label={isEditingActive ? "Collapse edit panel" : "Edit expense"}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-sm font-medium text-slate-800 transition-all duration-200 hover:bg-slate-200 hover:text-slate-950 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Pencil size={15} />
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ease-out ${
            isEditingActive ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>
      <button
        type="button"
        onClick={onDelete}
        disabled={isBusy}
        aria-label="Delete expense"
        className="inline-flex cursor-pointer items-center justify-center rounded-lg px-2.5 py-2 text-slate-500 transition-all duration-200 hover:text-rose-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}

export default function ExpenseList({
  expenses,
  showOwners = false,
  processingIds,
  onDelete,
  onUpdate,
}: ExpenseListProps) {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [dateRangeFilter, setDateRangeFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingPhase, setEditingPhase] = useState<
    "closed" | "opening" | "open" | "closing"
  >("closed");
  const [draft, setDraft] = useState<EditState | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteDialogMounted, setDeleteDialogMounted] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Expense | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const hasActiveFilters =
    categoryFilter !== "All" ||
    dateRangeFilter !== "All" ||
    searchQuery.trim().length > 0;

  const filteredExpenses = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return expenses.filter((expense) => {
      const matchesCategory =
        categoryFilter === "All" || expense.category === categoryFilter;

      let matchesDateRange = true;

      if (dateRangeFilter !== "All") {
        const expenseDate = new Date(`${expense.date}T00:00:00`);
        const diffDays = Math.floor(
          (today.getTime() - expenseDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (dateRangeFilter === "Last 7 days") {
          matchesDateRange = diffDays >= 0 && diffDays <= 6;
        } else if (dateRangeFilter === "Last 30 days") {
          matchesDateRange = diffDays >= 0 && diffDays <= 29;
        } else if (dateRangeFilter === "Last 90 days") {
          matchesDateRange = diffDays >= 0 && diffDays <= 89;
        }
      }

      const matchesSearch =
        normalizedQuery.length === 0 ||
        expense.title.toLowerCase().includes(normalizedQuery) ||
        expense.category.toLowerCase().includes(normalizedQuery) ||
        expense.description.toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesDateRange && matchesSearch;
    });
  }, [categoryFilter, dateRangeFilter, expenses, searchQuery]);

  const groupedExpenses = useMemo(() => {
    const groups = filteredExpenses.reduce<Record<string, Expense[]>>((acc, expense) => {
      if (!acc[expense.date]) {
        acc[expense.date] = [];
      }

      acc[expense.date].push(expense);
      return acc;
    }, {});

    return Object.entries(groups)
      .sort(([left], [right]) => right.localeCompare(left))
      .map(([date, groupExpenses]) => ({
        date,
        label: getGroupLabel(date),
        expenses: groupExpenses,
      }));
  }, [filteredExpenses]);

  async function handleSave(id: number) {
    if (!draft) {
      return;
    }

    setEditError(null);

    const fieldErrors = getExpenseFieldErrors({
      ...draft,
      amount: Number(draft.amount),
    });
    const firstFieldError = Object.values(fieldErrors)[0];

    if (firstFieldError) {
      setEditError(firstFieldError);
      return;
    }

    const validation = validateExpensePayload({
      ...draft,
      amount: Number(draft.amount),
    });

    if (!validation.success) {
      setEditError(validation.message);
      return;
    }

    const result = await onUpdate(id, validation.data);

    if (!result.success) {
      setEditError(result.message);
      return;
    }

    closeEditor();
  }

  function inputClass() {
    return "rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
  }

  function clearCloseTimer() {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }

  function openEditor(expense: Expense) {
    clearCloseTimer();

    if (editingId === expense.id && editingPhase !== "closed") {
      closeEditor();
      return;
    }

    setEditingId(expense.id);
    setDraft(buildEditState(expense));
    setEditError(null);
    setEditingPhase("opening");

    window.requestAnimationFrame(() => {
      setEditingPhase("open");
    });
  }

  function closeEditor() {
    clearCloseTimer();
    setEditingPhase("closing");
    closeTimerRef.current = window.setTimeout(() => {
      setEditingId(null);
      setDraft(null);
      setEditError(null);
      setEditingPhase("closed");
      closeTimerRef.current = null;
    }, PANEL_TRANSITION_MS);
  }

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, []);

  function clearFilters() {
    setCategoryFilter("All");
    setDateRangeFilter("All");
    setSearchQuery("");
  }

  function openDeleteDialog(expense: Expense) {
    setDeleteCandidate(expense);
    setDeleteDialogMounted(true);
    window.requestAnimationFrame(() => {
      setDeleteDialogOpen(true);
    });
  }

  function closeDeleteDialog() {
    setDeleteDialogOpen(false);
    window.setTimeout(() => {
      setDeleteDialogMounted(false);
      setDeleteCandidate(null);
    }, PANEL_TRANSITION_MS);
  }

  return (
    <>
      {deleteDialogMounted && deleteCandidate ? (
        <ConfirmDialog
          open={deleteDialogOpen}
          title="Delete expense?"
          description="Are you sure you want to delete this expense?"
          confirmLabel="Delete"
          isConfirming={processingIds.includes(deleteCandidate.id)}
          onCancel={closeDeleteDialog}
          onConfirm={() => {
            void onDelete(deleteCandidate.id).then((result) => {
              if (result.success) {
                closeDeleteDialog();
              }
            });
          }}
        />
      ) : null}

      <section className="min-h-[28rem]">
        <div className="pb-2">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Expenses
          </h2>
        </div>

        <div className="mb-5 grid gap-3 lg:grid-cols-[180px_180px_minmax(0,1fr)_auto]">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-600">Category</span>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="All">All</option>
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-600">Date range</span>
            <select
              value={dateRangeFilter}
              onChange={(event) => setDateRangeFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {DATE_RANGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1.5">
            <span className="text-sm font-medium text-slate-600">Search</span>
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search title, category, description"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-10 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 active:scale-[0.98]"
                >
                  ×
                </button>
              ) : null}
            </div>
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasActiveFilters}
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear filters
            </button>
          </div>
        </div>

        {hasActiveFilters ? (
          <div className="mb-4 text-sm font-medium text-slate-500">
            Showing {filteredExpenses.length} of {expenses.length} expenses
          </div>
        ) : null}

        {groupedExpenses.length === 0 ? (
          <div className="py-12 text-center text-sm font-medium text-slate-500">
            {hasActiveFilters ? "No matching expenses" : "No expenses yet"}
          </div>
        ) : (
          <div className="min-h-[20rem] space-y-8">
            {groupedExpenses.map((group) => (
              <div key={group.date}>
                <div className="mb-2 text-sm font-semibold text-slate-500">
                  {group.label}
                </div>

                <div>
                  {group.expenses.map((expense) => {
                    const Icon = getCategoryIcon(expense.category);
                    const ownerLabel = expense.ownerName
                      ? `Owner: ${expense.ownerName}`
                      : `Owner: User #${expense.userId}`;
                    const isEditingOpen =
                      editingId === expense.id && editingPhase === "open";
                    const isEditingActive =
                      editingId === expense.id && editingPhase !== "closed";
                    const isBusy = processingIds.includes(expense.id);

                    return (
                      <div
                        key={expense.id}
                        className="border-b border-gray-200"
                      >
                        <div className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
                          <div className="flex min-w-0 flex-1 items-start gap-3">
                            <Icon size={20} className="mt-0.5 shrink-0 text-gray-500" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3 lg:hidden">
                                <div className="min-w-0 flex-1">
                                  <div className="truncate font-medium text-slate-950">
                                    {expense.title}
                                  </div>
                                </div>
                                <span className="shrink-0 text-right text-base font-semibold tabular-nums text-slate-950">
                                  {formatCurrency(expense.amount)}
                                </span>
                              </div>

                              <div className="mt-1 flex items-end justify-between gap-3 lg:hidden">
                                <div className="min-w-0 flex-1">
                                  <div className="min-h-[1.25rem] truncate text-sm text-gray-500">
                                    {expense.description || "\u00A0"}
                                  </div>
                                  <div className="mt-0.5 text-sm text-gray-500">
                                    {expense.category} · {group.label}
                                    {showOwners ? ` · ${ownerLabel}` : ""}
                                  </div>
                                </div>

                                <ExpenseActions
                                  isBusy={isBusy}
                                  isEditingActive={isEditingActive}
                                  onEdit={() => openEditor(expense)}
                                  onDelete={() => openDeleteDialog(expense)}
                                />
                              </div>

                              <div className="hidden min-w-0 lg:flex lg:items-center lg:gap-4">
                                <span className="truncate font-medium text-slate-950">
                                  {expense.title}
                                </span>
                                <span className="shrink-0 text-sm text-gray-500">
                                  {expense.category} · {group.label}
                                </span>
                                {showOwners ? (
                                  <span className="shrink-0 text-sm font-medium text-slate-600">
                                    {ownerLabel}
                                  </span>
                                ) : null}
                                {expense.description ? (
                                  <span className="min-w-0 flex-1 truncate text-sm text-gray-500">
                                    {expense.description}
                                  </span>
                                ) : (
                                  <span className="min-w-0 flex-1" />
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="hidden items-center justify-between gap-3 lg:ml-4 lg:flex lg:shrink-0">
                            <span className="hidden text-right text-base font-semibold tabular-nums text-slate-950 lg:inline">
                              {formatCurrency(expense.amount)}
                            </span>
                            <ExpenseActions
                              isBusy={isBusy}
                              isEditingActive={isEditingActive}
                              onEdit={() => openEditor(expense)}
                              onDelete={() => openDeleteDialog(expense)}
                            />
                          </div>
                        </div>

                        {draft ? (
                          <div
                            className={`grid overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                              isEditingOpen
                                ? "grid-rows-[1fr] opacity-100"
                                : "grid-rows-[0fr] opacity-0"
                            }`}
                          >
                            <div className="min-h-0">
                              <div
                                className={`grid gap-4 border-t border-gray-100 py-4 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                  isEditingOpen
                                    ? "translate-y-0"
                                    : "translate-y-2"
                                }`}
                              >
                                <div className="grid gap-4 md:grid-cols-2">
                                  <input
                                    value={draft.title}
                                    onChange={(event) =>
                                      setDraft((current) =>
                                        current
                                          ? {
                                              ...current,
                                              title: event.target.value,
                                            }
                                          : current
                                      )
                                    }
                                    className={inputClass()}
                                  />
                                  <select
                                    value={draft.category}
                                    onChange={(event) =>
                                      setDraft((current) =>
                                        current
                                          ? {
                                              ...current,
                                              category: event.target.value,
                                            }
                                          : current
                                      )
                                    }
                                    className={inputClass()}
                                  >
                                    {EXPENSE_CATEGORIES.map((category) => (
                                      <option key={category} value={category}>
                                        {category}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={draft.amount}
                                    onChange={(event) =>
                                      setDraft((current) =>
                                        current
                                          ? {
                                              ...current,
                                              amount: event.target.value,
                                            }
                                          : current
                                      )
                                    }
                                    className={inputClass()}
                                  />
                                  <input
                                    type="date"
                                    max={getTodayDateString()}
                                    value={draft.date}
                                    onChange={(event) =>
                                      setDraft((current) =>
                                        current
                                          ? { ...current, date: event.target.value }
                                          : current
                                      )
                                    }
                                    className={inputClass()}
                                  />
                                </div>

                                <textarea
                                  value={draft.description}
                                  rows={3}
                                  onChange={(event) =>
                                    setDraft((current) =>
                                      current
                                        ? {
                                            ...current,
                                            description: event.target.value,
                                          }
                                        : current
                                    )
                                  }
                                  className={`${inputClass()} resize-none`}
                                />

                                {editError ? (
                                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                    {editError}
                                  </p>
                                ) : null}

                                <div className="flex flex-wrap gap-3">
                                  <button
                                    type="button"
                                    onClick={() => void handleSave(expense.id)}
                                    disabled={isBusy}
                                    className="cursor-pointer rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {isBusy ? "Saving..." : "Save"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={closeEditor}
                                    className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 active:scale-[0.98]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
