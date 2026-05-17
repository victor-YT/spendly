import "server-only";

import db from "@/lib/db";
import type { Expense, ExpensePayload } from "@/lib/expense-utils";

type ExpenseRow = {
  id: number;
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
      `SELECT id, title, category, amount, date, description, createdAt
       FROM expenses
       ORDER BY date DESC, createdAt DESC, id DESC`
    )
    .all() as ExpenseRow[];

  return rows.map(toExpense);
}

export function createExpense(data: ExpensePayload): Expense {
  const createdAt = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO expenses (title, category, amount, date, description, createdAt)
       VALUES (@title, @category, @amount, @date, @description, @createdAt)`
    )
    .run({
      ...data,
      description: data.description ?? "",
      createdAt,
    });

  const row = db
    .prepare(
      `SELECT id, title, category, amount, date, description, createdAt
       FROM expenses
       WHERE id = ?`
    )
    .get(result.lastInsertRowid) as ExpenseRow | undefined;

  if (!row) {
    throw new Error("Failed to create expense.");
  }

  return toExpense(row);
}

export function updateExpense(id: number, data: ExpensePayload): Expense | null {
  const result = db
    .prepare(
      `UPDATE expenses
       SET title = @title,
           category = @category,
           amount = @amount,
           date = @date,
           description = @description
       WHERE id = @id`
    )
    .run({
      id,
      ...data,
      description: data.description ?? "",
    });

  if (result.changes === 0) {
    return null;
  }

  const row = db
    .prepare(
      `SELECT id, title, category, amount, date, description, createdAt
       FROM expenses
       WHERE id = ?`
    )
    .get(id) as ExpenseRow | undefined;

  return row ? toExpense(row) : null;
}

export function deleteExpense(id: number): boolean {
  const result = db.prepare("DELETE FROM expenses WHERE id = ?").run(id);
  return result.changes > 0;
}
