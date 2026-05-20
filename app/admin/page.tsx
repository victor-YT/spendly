"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, LayoutDashboard } from "lucide-react";
import ChartSection from "@/app/components/ChartSection";
import ExpenseList from "@/app/components/ExpenseList";
import UserAvatar from "@/app/components/UserAvatar";
import UserProfilePanel from "@/app/components/UserProfilePanel";
import type { Expense } from "@/lib/expense-utils";
import { formatCurrency } from "@/lib/expense-utils";

type AdminUser = {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
};

type CurrentUser = AdminUser;

type Activity = {
  id: number;
  userId: number;
  action: string;
  details: string;
  createdAt: string;
  userName: string;
  userEmail: string;
};

type ApiError = {
  error?: string;
};

async function getErrorMessage(response: Response) {
  try {
    const body = (await response.json()) as ApiError;
    return body.error ?? "Something went wrong.";
  } catch {
    return "Something went wrong.";
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

function CollapsibleSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-4 p-6 text-left transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100"
        aria-expanded={open}
      >
        <h2 className="text-lg font-semibold tracking-tight text-slate-950">
          {title}
        </h2>
        <ChevronDown
          size={20}
          className={`shrink-0 text-slate-500 transition-transform duration-300 ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-slate-100 p-6">{children}</div>
        </div>
      </div>
    </section>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allActivities, setAllActivities] = useState<Activity[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");
  const [isExpensesOpen, setIsExpensesOpen] = useState(true);
  const [isUsersOpen, setIsUsersOpen] = useState(true);
  const [isActivitiesOpen, setIsActivitiesOpen] = useState(true);
  const [isProfilePanelMounted, setIsProfilePanelMounted] = useState(false);
  const [isProfilePanelOpen, setIsProfilePanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const actions = useMemo(
    () =>
      Array.from(new Set(allActivities.map((activity) => activity.action))).sort(),
    [allActivities]
  );

  const totalSpending = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const loadAdminData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const userResponse = await fetch("/api/admin/users", {
        cache: "no-store",
      });

      if (userResponse.status === 401) {
        router.replace("/login");
        return;
      }

      if (userResponse.status === 403) {
        router.replace("/");
        return;
      }

      if (!userResponse.ok) {
        throw new Error(await getErrorMessage(userResponse));
      }

      const [
        userData,
        expenseResponse,
        allActivityResponse,
        currentUserResponse,
      ] = await Promise.all([
        userResponse.json() as Promise<{ users: AdminUser[] }>,
        fetch("/api/admin/expenses", { cache: "no-store" }),
        fetch("/api/admin/activities", { cache: "no-store" }),
        fetch("/api/auth/me", { cache: "no-store" }),
      ]);

      setUsers(userData.users);

      if (!expenseResponse.ok) {
        throw new Error(await getErrorMessage(expenseResponse));
      }

      const expenseData = (await expenseResponse.json()) as {
        expenses: Expense[];
      };
      setExpenses(expenseData.expenses);

      if (!allActivityResponse.ok) {
        throw new Error(await getErrorMessage(allActivityResponse));
      }

      const allActivityData = (await allActivityResponse.json()) as {
        activities: Activity[];
      };
      setAllActivities(allActivityData.activities);

      if (currentUserResponse.ok) {
        const currentUserData = (await currentUserResponse.json()) as {
          user: CurrentUser;
        };
        setCurrentUser(currentUserData.user);
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load admin data."
      );
      setIsLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();

      if (selectedUserId !== "all") {
        params.set("userId", selectedUserId);
      }

      if (selectedAction !== "all") {
        params.set("action", selectedAction);
      }

      const activityResponse = await fetch(
        `/api/admin/activities${params.size ? `?${params.toString()}` : ""}`,
        { cache: "no-store" }
      );

      if (!activityResponse.ok) {
        throw new Error(await getErrorMessage(activityResponse));
      }

      const activityData = (await activityResponse.json()) as {
        activities: Activity[];
      };
      setActivities(activityData.activities);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to load activities."
      );
    } finally {
      setIsLoading(false);
    }
  }, [router, selectedAction, selectedUserId]);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

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

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/login");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {currentUser && isProfilePanelMounted ? (
        <UserProfilePanel
          open={isProfilePanelOpen}
          user={currentUser}
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
              Admin
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {currentUser ? (
              <div className="flex min-w-0 items-center gap-2">
                <button
                  type="button"
                  onClick={openProfilePanel}
                  aria-label="Open profile"
                  className="cursor-pointer rounded-full transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100 active:scale-[0.98]"
                >
                  <UserAvatar
                    name={currentUser.name}
                    email={currentUser.email}
                  />
                </button>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-slate-950">
                    {currentUser.name || currentUser.email || "User"}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="group relative">
              <Link
                href="/"
                aria-label="Dashboard"
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-100 active:scale-[0.98]"
              >
                <LayoutDashboard size={18} />
              </Link>
              <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100">
                Dashboard
              </span>
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-white p-5 text-sm font-medium text-rose-700 shadow-sm">
            {error}
          </div>
        ) : null}

        <section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard label="Total users" value={String(users.length)} />
            <SummaryCard label="Total expenses" value={String(expenses.length)} />
            <SummaryCard
              label="Total spending"
              value={formatCurrency(totalSpending)}
            />
            <SummaryCard
              label="Total activities"
              value={isLoading ? "..." : String(allActivities.length)}
            />
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-950">
            Global spending
          </h2>
          <ChartSection expenses={expenses} />
        </section>

        <CollapsibleSection
          title="All expenses"
          open={isExpensesOpen}
          onToggle={() => setIsExpensesOpen((current) => !current)}
        >
          <ExpenseList
            expenses={expenses}
            showTitle={false}
            showOwners
            readOnly
            processingIds={[]}
          />
        </CollapsibleSection>

        <CollapsibleSection
          title="Users"
          open={isUsersOpen}
          onToggle={() => setIsUsersOpen((current) => !current)}
        >
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="py-3 pr-4 font-medium">User</th>
                  <th className="py-3 pr-4 font-medium">Role</th>
                  <th className="py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={user.name} email={user.email} size="sm" />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-950">
                            {user.name || "User"}
                          </div>
                          <div className="truncate text-slate-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{user.role}</td>
                    <td className="py-3 text-slate-600">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="User activities"
          open={isActivitiesOpen}
          onToggle={() => setIsActivitiesOpen((current) => !current)}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm text-slate-500">
                {isLoading ? "Loading..." : `${activities.length} activities`}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-600">User</span>
                <select
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All users</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm font-medium text-slate-600">Action</span>
                <select
                  value={selectedAction}
                  onChange={(event) => setSelectedAction(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All actions</option>
                  {actions.map((action) => (
                    <option key={action} value={action}>
                      {action}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="py-3 pr-4 font-medium">User</th>
                  <th className="py-3 pr-4 font-medium">Action</th>
                  <th className="py-3 pr-4 font-medium">Details</th>
                  <th className="py-3 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => (
                  <tr key={activity.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={activity.userName}
                          email={activity.userEmail}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-950">
                            {activity.userName ?? `User #${activity.userId}`}
                          </div>
                          <div className="truncate text-slate-500">
                            {activity.userEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {activity.action}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {activity.details || "-"}
                    </td>
                    <td className="py-3 text-slate-600">
                      {formatDate(activity.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {!isLoading && activities.length === 0 ? (
              <div className="py-10 text-center text-sm font-medium text-slate-500">
                No activities found
              </div>
            ) : null}
          </div>
        </CollapsibleSection>
      </div>
    </main>
  );
}
