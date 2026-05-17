import "server-only";

import jwt from "jsonwebtoken";
import { getUserById, type PublicUser, toPublicUser } from "@/models/user";

export const AUTH_COOKIE_NAME = "spendly_token";

const jwtSecret = process.env.JWT_SECRET ?? "spendly-local-demo-secret";
const tokenMaxAgeSeconds = 60 * 60 * 24 * 7;

type TokenPayload = {
  userId: number;
};

export type AuthUser = PublicUser;

export function signToken(user: AuthUser) {
  return jwt.sign({ userId: user.id }, jwtSecret, {
    expiresIn: tokenMaxAgeSeconds,
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, jwtSecret);

    if (
      typeof payload === "object" &&
      payload !== null &&
      typeof payload.userId === "number"
    ) {
      return { userId: payload.userId };
    }

    return null;
  } catch {
    return null;
  }
}

function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function getAuthUser(request: Request): AuthUser | null {
  const token = getCookieValue(request, AUTH_COOKIE_NAME);

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);

  if (!payload) {
    return null;
  }

  const user = getUserById(payload.userId);
  return user ? toPublicUser(user) : null;
}

export function requireAuth(request: Request): AuthUser | Response {
  const user = getAuthUser(request);

  if (!user) {
    return Response.json({ error: "Please log in first." }, { status: 401 });
  }

  return user;
}

export function requireAdmin(request: Request): AuthUser | Response {
  const user = requireAuth(request);

  if (user instanceof Response) {
    return user;
  }

  if (user.role !== "admin") {
    return Response.json({ error: "Admin access required." }, { status: 403 });
  }

  return user;
}

export function createAuthCookie(token: string) {
  return `${AUTH_COOKIE_NAME}=${encodeURIComponent(
    token
  )}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${tokenMaxAgeSeconds}`;
}

export function clearAuthCookie() {
  return `${AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
