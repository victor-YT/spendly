import { requireAdmin } from "@/lib/auth";
import { getAllUsers } from "@/models/user";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = requireAdmin(request);

  if (user instanceof Response) {
    return user;
  }

  return Response.json({ users: getAllUsers() });
}
