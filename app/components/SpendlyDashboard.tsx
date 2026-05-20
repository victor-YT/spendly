"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useCallback, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import ChartSection from "@/app/components/ChartSection";
import ExpenseForm from "@/app/components/ExpenseForm";
import ExpenseList from "@/app/components/ExpenseList";
import ToastViewport, { type Toast } from "@/app/components/ToastViewport";
import UserAvatar from "@/app/components/UserAvatar";
import UserProfilePanel from "@/app/components/UserProfilePanel";
import type { Expense, ExpensePayload } from "@/lib/expense-utils";
import { formatCurrency } from "@/lib/expense-utils";

type ApiError = {
  error?: string;
};

type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
};

function sortExpenses(expenses: Expense[]) {
  return [...expenses].sort((left, right) => {
    const dateCompare = right.date.localeCompare(left.date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    const createdCompare = right.createdAt.localeCompare(left.createdAt);

    if (createdCompare !== 0) {
      return createdCompare;
    }

    return right.id - left.id;
  });
}

function getTrend(current: number, previous: number) {
  if (current === 0 && previous === 0) {
    return "0%";
  }

  if (previous === 0) {
    return "+100%";
  }

  const delta = ((current - previous) / previous) * 100;
  const rounded = Math.round(delta);

  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

async function getErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as ApiError;
    return body.error ?? "Something went wrong.";
  } catch {
    return "Something went wrong.";
  }
}

type SummaryCardProps = {
  label: string;
  value: string;
  trend: string;
};

function SummaryCard({ label, value, trend }: SummaryCardProps) {
  const positive = trend.startsWith("+");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
      <p
        className={`mt-3 text-sm font-medium ${
          positive ? "text-emerald-600" : "text-slate-500"
        }`}
      >
        {trend} vs last week
      </p>
    </div>
  );
}

export default function SpendlyDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [processingIds, setProcessingIds] = useState<number[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreateModalMounted, setIsCreateModalMounted] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfilePanelMounted, setIsProfilePanelMounted] = useState(false);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  function pushToast(message: string, tone: Toast["tone"]) {
    setToasts((current) => [
      ...current,
      {
        id: Date.now() + Math.floor(Math.random() * 1000),
        message,
        tone,
      },
    ]);
  }

  function dismissToast(id: number) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  function openCreateModal() {
    setIsCreateModalMounted(true);
    window.requestAnimationFrame(() => {
      setIsCreateModalOpen(true);
    });
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false);
    window.setTimeout(() => {
      setIsCreateModalMounted(false);
    }, 220);
  }

  function openProfilePanel() {
    setIsProfilePanelMounted(true);
    window.requestAnimationFrame(() => {
      setIsProfilePanelOpen(true);
    });
  }

  function closeProfilePanel() {
    setIsProfilePanelOpen(false);
    window.setTimeout(() => {
      setIsProfilePanelMounted(false);
    }, 220);
  }

  const loadExpenses = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch("/api/expenses", {
        cache: "no-store",
      });

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data = (await response.json()) as { expenses: Expense[] };
      setExpenses(sortExpenses(data.expenses));
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load expenses."
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    async function loadSession() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!response.ok) {
          router.replace("/login");
          return;
        }

        const data = (await response.json()) as { user: CurrentUser };
        setUser(data.user);
        await loadExpenses();
      } catch {
        setLoadError("Unable to check your login session.");
        setIsLoading(false);
      }
    }

    void loadSession();
  }, [loadExpenses, router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh();
  }

  async function handleCreateExpense(payload: ExpensePayload) {
    setIsCreating(true);

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data = (await response.json()) as { expense: Expense };
      startTransition(() => {
        setExpenses((current) => sortExpenses([data.expense, ...current]));
      });
      pushToast("Expense added", "success");
      closeCreateModal();

      return { success: true as const };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create expense.";
      pushToast("Error occurred", "error");
      return { success: false as const, message };
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteExpense(id: number) {
    const previousExpenses = expenses;

    setProcessingIds((current) => [...current, id]);
    startTransition(() => {
      setExpenses((current) => current.filter((expense) => expense.id !== id));
    });

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      pushToast("Expense deleted", "success");
      return { success: true as const };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to delete expense.";
      setExpenses(previousExpenses);
      pushToast("Error occurred", "error");
      return { success: false as const, message };
    } finally {
      setProcessingIds((current) => current.filter((value) => value !== id));
    }
  }

  async function handleUpdateExpense(id: number, payload: ExpensePayload) {
    setProcessingIds((current) => [...current, id]);

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data = (await response.json()) as { expense: Expense };
      startTransition(() => {
        setExpenses((current) =>
          sortExpenses(
            current.map((expense) =>
              expense.id === id ? data.expense : expense
            )
          )
        );
      });
      pushToast("Expense updated", "success");

      return { success: true as const };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update expense.";
      pushToast("Error occurred", "error");
      return { success: false as const, message };
    } finally {
      setProcessingIds((current) => current.filter((value) => value !== id));
    }
  }

  const totalSpend = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const topCategoryEntry = Object.entries(
    expenses.reduce<Record<string, number>>((summary, expense) => {
      summary[expense.category] = (summary[expense.category] ?? 0) + expense.amount;
      return summary;
    }, {})
  ).sort((left, right) => right[1] - left[1])[0];

  const today = new Date();
  const recentPeriodStart = new Date(today);
  recentPeriodStart.setDate(today.getDate() - 6);

  const previousPeriodStart = new Date(today);
  previousPeriodStart.setDate(today.getDate() - 13);

  const previousPeriodEnd = new Date(today);
  previousPeriodEnd.setDate(today.getDate() - 7);

  const recentExpenses = expenses.filter((expense) => {
    const date = new Date(`${expense.date}T00:00:00`);
    return date >= recentPeriodStart && date <= today;
  });

  const previousExpenses = expenses.filter((expense) => {
    const date = new Date(`${expense.date}T00:00:00`);
    return date >= previousPeriodStart && date <= previousPeriodEnd;
  });

  const recentSpend = recentExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const previousSpend = previousExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const totalTrend = getTrend(recentSpend, previousSpend);
  const countTrend = getTrend(recentExpenses.length, previousExpenses.length);

  const recentTopCategoryValue = recentExpenses
    .filter((expense) => expense.category === topCategoryEntry?.[0])
    .reduce((sum, expense) => sum + expense.amount, 0);

  const previousTopCategoryValue = previousExpenses
    .filter((expense) => expense.category === topCategoryEntry?.[0])
    .reduce((sum, expense) => sum + expense.amount, 0);

  const topCategoryTrend = topCategoryEntry
    ? getTrend(recentTopCategoryValue, previousTopCategoryValue)
    : "0%";

  return (
    <>
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />

      {isCreateModalMounted ? (
        <ExpenseForm
          open={isCreateModalOpen}
          isSubmitting={isCreating}
          onClose={closeCreateModal}
          onCreate={handleCreateExpense}
        />
      ) : null}

      {user && isProfilePanelMounted ? (
        <UserProfilePanel
          open={isProfilePanelOpen}
          user={user}
          onClose={closeProfilePanel}
          onLogout={handleLogout}
        />
      ) : null}

      <div className="page-transition mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-sm font-semibold text-white">
              S
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
              Spendly
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {user ? (
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={openProfilePanel}
                  aria-label="Open profile"
                  className="cursor-pointer rounded-full transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100 active:scale-[0.98]"
                >
                  <UserAvatar name={user.name} email={user.email} />
                </button>
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-sm font-semibold text-slate-950">
                    {user.name || user.email || "User"}
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    {user.role}
                  </div>
                </div>
              </div>
            ) : null}
            {user?.role === "admin" ? (
              <div className="group relative">
                <Link
                  href="/admin"
                  aria-label="Admin"
                  className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-300 text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100 active:scale-[0.98]"
                >
                  <ShieldCheck size={18} />
                </Link>
                <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100">
                  Admin
                </span>
              </div>
            ) : null}
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-slate-800 active:scale-[0.98]"
            >
              <span className="text-base leading-none">+</span>
              Add Expense
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <SummaryCard
            label="Total Spending"
            value={formatCurrency(totalSpend)}
            trend={totalTrend}
          />
          <SummaryCard
            label="Number of Expenses"
            value={String(expenses.length)}
            trend={countTrend}
          />
          <SummaryCard
            label="Top Category"
            value={topCategoryEntry?.[0] ?? "No data"}
            trend={topCategoryTrend}
          />
        </section>

        {isLoading ? (
          <div className="grid gap-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-[320px] animate-pulse rounded-xl border border-slate-200 bg-white" />
              <div className="h-[320px] animate-pulse rounded-xl border border-slate-200 bg-white" />
            </div>
            <div className="h-[420px] animate-pulse rounded-xl border border-slate-200 bg-white" />
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-rose-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Unable to load</h2>
            <p className="mt-2 text-sm text-slate-600">{loadError}</p>
            <button
              type="button"
              onClick={() => void loadExpenses()}
              className="mt-5 inline-flex cursor-pointer rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-slate-800 active:scale-[0.98]"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <ChartSection expenses={expenses} />
            <ExpenseList
              expenses={expenses}
              processingIds={processingIds}
              onDelete={handleDeleteExpense}
              onUpdate={handleUpdateExpense}
            />
          </>
        )}
      </div>
    </>
  );
}
