import { requireAdmin } from "@/lib/auth";
import { getAllActivities } from "@/models/activity";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = requireAdmin(request);

  if (user instanceof Response) {
    return user;
  }

  const url = new URL(request.url);
  const userId = Number(url.searchParams.get("userId"));
  const action = url.searchParams.get("action")?.trim() || undefined;

  const activities = getAllActivities({
    userId: Number.isInteger(userId) && userId > 0 ? userId : undefined,
    action,
  });

  return Response.json({ activities });
}
