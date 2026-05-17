import bcrypt from "bcryptjs";
import { createAuthCookie, signToken } from "@/lib/auth";
import { logActivity } from "@/models/activity";
import { getUserByEmail, toPublicUser } from "@/models/user";

export const dynamic = "force-dynamic";

function validateLogin(input: unknown) {
  if (!input || typeof input !== "object") {
    return { error: "Invalid login details." };
  }

  const raw = input as Record<string, unknown>;
  const email = String(raw.email ?? "").trim().toLowerCase();
  const password = String(raw.password ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  return { data: { email, password } };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateLogin(body);

    if ("error" in validation) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const user = getUserByEmail(validation.data.email);

    if (!user) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const passwordMatches = await bcrypt.compare(
      validation.data.password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return Response.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const publicUser = toPublicUser(user);
    const token = signToken(publicUser);
    logActivity({
      userId: user.id,
      action: "login",
      details: `Logged in ${user.email}`,
    });

    return Response.json(
      { user: publicUser },
      {
        headers: {
          "Set-Cookie": createAuthCookie(token),
        },
      }
    );
  } catch (error) {
    console.error("Failed to log in", error);
    return Response.json(
      { error: "Unable to log in right now." },
      { status: 500 }
    );
  }
}
