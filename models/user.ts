import "server-only";

import db from "@/lib/db";

export type UserRole = "user" | "admin";

export type User = {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
};

export type PublicUser = Omit<User, "passwordHash">;

type UserRow = {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  createdAt: string;
};

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role === "admin" ? "admin" : "user",
    createdAt: row.createdAt,
  };
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function getUserById(id: number): User | null {
  const row = db
    .prepare(
      `SELECT id, name, email, passwordHash, role, createdAt
       FROM users
       WHERE id = ?`
    )
    .get(id) as UserRow | undefined;

  return row ? toUser(row) : null;
}

export function getUserByEmail(email: string): User | null {
  const row = db
    .prepare(
      `SELECT id, name, email, passwordHash, role, createdAt
       FROM users
       WHERE lower(email) = lower(?)`
    )
    .get(email) as UserRow | undefined;

  return row ? toUser(row) : null;
}

export function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role?: UserRole;
}): User {
  const createdAt = new Date().toISOString();
  const result = db
    .prepare(
      `INSERT INTO users (name, email, passwordHash, role, createdAt)
       VALUES (@name, @email, @passwordHash, @role, @createdAt)`
    )
    .run({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      role: input.role ?? "user",
      createdAt,
    });

  const user = getUserById(Number(result.lastInsertRowid));

  if (!user) {
    throw new Error("Failed to create user.");
  }

  return user;
}

export function getAllUsers(): PublicUser[] {
  const rows = db
    .prepare(
      `SELECT id, name, email, passwordHash, role, createdAt
       FROM users
       ORDER BY createdAt DESC, id DESC`
    )
    .all() as UserRow[];

  return rows.map(toUser).map(toPublicUser);
}
