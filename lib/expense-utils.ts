export const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Healthcare",
  "Entertainment",
  "Shopping",
  "Travel",
  "Education",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type Expense = {
  id: number;
  userId: number;
  ownerName?: string;
  ownerEmail?: string;
  title: string;
  category: ExpenseCategory | string;
  amount: number;
  date: string;
  description: string;
  createdAt: string;
};

export type ExpensePayload = {
  title: string;
  category: string;
  amount: number;
  date: string;
  description?: string;
};

export type ExpenseFieldErrors = Partial<
  Record<"title" | "category" | "amount" | "date" | "description", string>
>;

type ValidationResult =
  | { success: true; data: ExpensePayload }
  | { success: false; message: string };

export function validateExpensePayload(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") {
    return { success: false, message: "Invalid expense payload." };
  }

  const raw = input as Record<string, unknown>;
  const title = String(raw.title ?? "").trim();
  const category = String(raw.category ?? "").trim();
  const description = String(raw.description ?? "").trim();
  const amount = Number(raw.amount);
  const date = String(raw.date ?? "").trim();

  const fieldErrors = getExpenseFieldErrors({
    title,
    category,
    amount,
    date,
    description,
  });

  const firstError = Object.values(fieldErrors)[0];

  if (firstError) {
    return { success: false, message: firstError };
  }

  return {
    success: true,
    data: {
      title,
      category,
      amount: Number(amount.toFixed(2)),
      date,
      description,
    },
  };
}

export function getExpenseFieldErrors(input: {
  title: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}): ExpenseFieldErrors {
  const errors: ExpenseFieldErrors = {};

  if (input.title.length < 2) {
    errors.title = "Title must be at least 2 characters long.";
  }

  if (!input.category) {
    errors.category = "Category is required.";
  }

  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    errors.amount = "Amount must be greater than 0.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) {
    errors.date = "Date must be in YYYY-MM-DD format.";
  } else {
    const parsedDate = new Date(`${input.date}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      errors.date = "Date is invalid.";
    } else if (input.date > getTodayDateString()) {
      errors.date = "Date cannot be in the future.";
    }
  }

  if (input.description.length > 280) {
    errors.description = "Description must be 280 characters or fewer.";
  }

  return errors;
}

export function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatExpenseDate(date: string) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}
