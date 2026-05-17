import { clearAuthCookie, getAuthUser } from "@/lib/auth";
import { logActivity } from "@/models/activity";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = getAuthUser(request);

  if (user) {
    logActivity({
      userId: user.id,
      action: "logout",
      details: `Logged out ${user.email}`,
    });
  }

  return Response.json(
    { success: true },
    {
      headers: {
        "Set-Cookie": clearAuthCookie(),
      },
    }
  );
}
