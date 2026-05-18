import { requireAuth } from "@/lib/auth";
import { logActivity } from "@/models/activity";
import { createExpense, getExpensesForUser } from "@/models/expense";
import { validateExpensePayload } from "@/lib/expense-utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const user = requireAuth(request);

    if (user instanceof Response) {
      return user;
    }

    const expenses = getExpensesForUser(user.id);

    return Response.json({ expenses });
  } catch (error) {
    console.error("Failed to fetch expenses", error);
    return Response.json(
      { error: "Unable to load expenses right now." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateExpensePayload(body);

    if (!validation.success) {
      return Response.json({ error: validation.message }, { status: 400 });
    }

    const user = requireAuth(request);

    if (user instanceof Response) {
      return user;
    }

    const expense = createExpense(validation.data, user.id);
    logActivity({
      userId: user.id,
      action: "create expense",
      details: `Created ${expense.title}`,
    });

    return Response.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("Failed to create expense", error);
    return Response.json(
      { error: "Unable to create the expense right now." },
      { status: 500 }
    );
  }
}
