import "server-only";

import db from "@/lib/db";

export type UserActivity = {
  id: number;
  userId: number;
  action: string;
  details: string;
  createdAt: string;
  userName: string;
  userEmail: string;
};

type ActivityRow = UserActivity;

export function logActivity(input: {
  userId: number;
  action: string;
  details?: string;
}) {
  db.prepare(
    `INSERT INTO user_activities (userId, action, details, createdAt)
     VALUES (@userId, @action, @details, @createdAt)`
  ).run({
    userId: input.userId,
    action: input.action,
    details: input.details ?? "",
    createdAt: new Date().toISOString(),
  });
}

export function getAllActivities(filters?: {
  userId?: number;
  action?: string;
}): UserActivity[] {
  const conditions: string[] = [];
  const params: Record<string, string | number> = {};

  if (filters?.userId) {
    conditions.push("a.userId = @userId");
    params.userId = filters.userId;
  }

  if (filters?.action) {
    conditions.push("a.action = @action");
    params.action = filters.action;
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT a.id,
              a.userId,
              a.action,
              a.details,
              a.createdAt,
              u.name AS userName,
              u.email AS userEmail
       FROM user_activities a
       LEFT JOIN users u ON u.id = a.userId
       ${whereClause}
       ORDER BY a.createdAt DESC, a.id DESC`
    )
    .all(params) as ActivityRow[];

  return rows;
}
