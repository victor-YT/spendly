import bcrypt from "bcryptjs";
import { createAuthCookie, signToken } from "@/lib/auth";
import { logActivity } from "@/models/activity";
import { createUser, getUserByEmail, toPublicUser } from "@/models/user";

export const dynamic = "force-dynamic";

function validateRegister(input: unknown) {
  if (!input || typeof input !== "object") {
    return { error: "Invalid registration details." };
  }

  const raw = input as Record<string, unknown>;
  const name = String(raw.name ?? "").trim();
  const email = String(raw.email ?? "").trim().toLowerCase();
  const password = String(raw.password ?? "");

  if (name.length < 2) {
    return { error: "Name must be at least 2 characters." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  return { data: { name, email, password } };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = validateRegister(body);

    if ("error" in validation) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const { name, email, password } = validation.data;

    if (getUserByEmail(email)) {
      return Response.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = createUser({ name, email, passwordHash });
    logActivity({
      userId: user.id,
      action: "register",
      details: `Registered ${user.email}`,
    });

    const publicUser = toPublicUser(user);
    const token = signToken(publicUser);

    return Response.json(
      { user: publicUser },
      {
        status: 201,
        headers: {
          "Set-Cookie": createAuthCookie(token),
        },
      }
    );
  } catch (error) {
    console.error("Failed to register", error);
    return Response.json(
      { error: "Unable to register right now." },
      { status: 500 }
    );
  }
}
