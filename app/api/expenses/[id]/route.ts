import { requireAuth } from "@/lib/auth";
import { deleteExpense, updateExpense } from "@/models/expense";
import { validateExpensePayload } from "@/lib/expense-utils";

export const dynamic = "force-dynamic";

function parseExpenseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(
  request: Request,
  context: RouteContext<"/api/expenses/[id]">
) {
  try {
    const { id: rawId } = await context.params;
    const id = parseExpenseId(rawId);

    if (!id) {
      return Response.json({ error: "Invalid expense id." }, { status: 400 });
    }

    const user = requireAuth(request);

    if (user instanceof Response) {
      return user;
    }

    const body = await request.json();
    const validation = validateExpensePayload(body);

    if (!validation.success) {
      return Response.json({ error: validation.message }, { status: 400 });
    }

    const expense = updateExpense(
      id,
      user.id,
      validation.data,
      user.role === "admin"
    );

    if (!expense) {
      return Response.json({ error: "Expense not found." }, { status: 404 });
    }

    return Response.json({ expense });
  } catch (error) {
    console.error("Failed to update expense", error);
    return Response.json(
      { error: "Unable to update the expense right now." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext<"/api/expenses/[id]">
) {
  try {
    const { id: rawId } = await context.params;
    const id = parseExpenseId(rawId);

    if (!id) {
      return Response.json({ error: "Invalid expense id." }, { status: 400 });
    }

    const user = requireAuth(request);

    if (user instanceof Response) {
      return user;
    }

    const deleted = deleteExpense(id, user.id, user.role === "admin");

    if (!deleted) {
      return Response.json({ error: "Expense not found." }, { status: 404 });
    }

    return Response.json({ success: true, id });
  } catch (error) {
    console.error("Failed to delete expense", error);
    return Response.json(
      { error: "Unable to delete the expense right now." },
      { status: 500 }
    );
  }
}
