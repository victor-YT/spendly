"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import UserAvatar from "@/app/components/UserAvatar";

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

export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [selectedAction, setSelectedAction] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const actions = useMemo(
    () => Array.from(new Set(activities.map((activity) => activity.action))).sort(),
    [activities]
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

      const userData = (await userResponse.json()) as { users: AdminUser[] };
      setUsers(userData.users);

      const currentUserResponse = await fetch("/api/auth/me", {
        cache: "no-store",
      });

      if (currentUserResponse.ok) {
        const currentUserData = (await currentUserResponse.json()) as {
          user: CurrentUser;
        };
        setCurrentUser(currentUserData.user);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to load users.");
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

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black text-sm font-semibold text-white">
              S
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                Admin
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Users and activity history
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {currentUser ? (
              <div className="flex min-w-0 items-center gap-2">
                <UserAvatar name={currentUser.name} email={currentUser.email} />
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-sm font-semibold text-slate-950">
                    {currentUser.name || currentUser.email || "User"}
                  </div>
                  <div className="text-xs font-medium text-slate-500">
                    {currentUser.role}
                  </div>
                </div>
              </div>
            ) : null}
            <Link
              href="/"
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 hover:bg-slate-50 active:scale-[0.98]"
            >
              Dashboard
            </Link>
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-white p-5 text-sm font-medium text-rose-700 shadow-sm">
            {error}
          </div>
        ) : null}

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Users
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="text-slate-500">
                <tr className="border-b border-slate-200">
                  <th className="py-3 pr-4 font-medium">Name</th>
                  <th className="py-3 pr-4 font-medium">Email</th>
                  <th className="py-3 pr-4 font-medium">Role</th>
                  <th className="py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium text-slate-950">
                      {user.name}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">{user.email}</td>
                    <td className="py-3 pr-4 text-slate-600">{user.role}</td>
                    <td className="py-3 text-slate-600">
                      {formatDate(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                User activities
              </h2>
              <p className="mt-1 text-sm text-slate-500">
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
                      <div className="font-medium text-slate-950">
                        {activity.userName ?? `User #${activity.userId}`}
                      </div>
                      <div className="text-slate-500">{activity.userEmail}</div>
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
        </section>
      </div>
    </main>
  );
}
