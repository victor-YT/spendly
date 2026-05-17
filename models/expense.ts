import "server-only";

import db from "@/lib/db";
import type { Expense, ExpensePayload } from "@/lib/expense-utils";

type ExpenseRow = {
  id: number;
  userId: number;
  title: string;
  category: string;
  amount: number;
  date: string;
  description: string | null;
  createdAt: string;
};

function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    category: row.category,
    amount: Number(row.amount),
    date: row.date,
    description: row.description ?? "",
    createdAt: row.createdAt,
  };
}

export function getAllExpenses(): Expense[] {
  const rows = db
    .prepare(
      `SELECT id, userId, title, category, amount, date, description, createdAt
       FROM expenses
       ORDER BY date DESC, createdAt DESC, id DESC`
    )
    .all() as ExpenseRow[];

  return rows.map(toExpense);
}

export function getExpensesForUser(userId: number): Expense[] {
  const rows = db
    .prepare(
      `SELECT id, userId, title, category, amount, date, description, createdAt
       FROM expenses
       WHERE userId = ?
       ORDER BY date DESC, createdAt DESC, id DESC`
    )
    .all(userId) as ExpenseRow[];

  return rows.map(toExpense);
}

export function createExpense(data: ExpensePayload, userId: number): Expense {
  const createdAt = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO expenses (userId, title, category, amount, date, description, createdAt)
       VALUES (@userId, @title, @category, @amount, @date, @description, @createdAt)`
    )
    .run({
      userId,
      ...data,
      description: data.description ?? "",
      createdAt,
    });

  const row = db
    .prepare(
      `SELECT id, userId, title, category, amount, date, description, createdAt
       FROM expenses
       WHERE id = ?`
    )
    .get(result.lastInsertRowid) as ExpenseRow | undefined;

  if (!row) {
    throw new Error("Failed to create expense.");
  }

  return toExpense(row);
}

export function updateExpense(
  id: number,
  userId: number,
  data: ExpensePayload,
  isAdmin = false
): Expense | null {
  const result = db
    .prepare(
      `UPDATE expenses
       SET title = @title,
           category = @category,
           amount = @amount,
           date = @date,
           description = @description
       WHERE id = @id
         AND (@isAdmin = 1 OR userId = @userId)`
    )
    .run({
      id,
      userId,
      isAdmin: isAdmin ? 1 : 0,
      ...data,
      description: data.description ?? "",
    });

  if (result.changes === 0) {
    return null;
  }

  const row = db
    .prepare(
      `SELECT id, userId, title, category, amount, date, description, createdAt
       FROM expenses
       WHERE id = ?`
    )
    .get(id) as ExpenseRow | undefined;

  return row ? toExpense(row) : null;
}

export function deleteExpense(id: number, userId: number, isAdmin = false): boolean {
  const result = db
    .prepare("DELETE FROM expenses WHERE id = ? AND (? = 1 OR userId = ?)")
    .run(id, isAdmin ? 1 : 0, userId);

  return result.changes > 0;
}
