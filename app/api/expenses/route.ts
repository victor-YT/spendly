import { createExpense, getAllExpenses } from "@/models/expense";
import { validateExpensePayload } from "@/lib/expense-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const expenses = getAllExpenses();
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

    const expense = createExpense(validation.data);
    return Response.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("Failed to create expense", error);
    return Response.json(
      { error: "Unable to create the expense right now." },
      { status: 500 }
    );
  }
}
