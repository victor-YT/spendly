import "server-only";

import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import path from "node:path";

const databasePath = path.join(process.cwd(), "expenses.db");

declare global {
  var spendlyDb: Database.Database | undefined;
}

const db =
  globalThis.spendlyDb ??
  new Database(databasePath, {
    fileMustExist: false,
  });

function hasColumn(tableName: string, columnName: string) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as {
    name: string;
  }[];

  return columns.some((column) => column.name === columnName);
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL
  );
`);

const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@spendly.local";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
const existingAdmin = db
  .prepare("SELECT id FROM users WHERE email = ?")
  .get(adminEmail) as { id: number } | undefined;

let adminId = existingAdmin?.id;

if (!adminId) {
  const createdAt = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(adminPassword, 10);
  const result = db
    .prepare(
      `INSERT INTO users (name, email, passwordHash, role, createdAt)
       VALUES (?, ?, ?, 'admin', ?)`
    )
    .run("Demo Admin", adminEmail, passwordHash, createdAt);

  adminId = Number(result.lastInsertRowid);
}

if (!hasColumn("expenses", "userId")) {
  db.exec(`ALTER TABLE expenses ADD COLUMN userId INTEGER NOT NULL DEFAULT ${adminId}`);
}

if (process.env.NODE_ENV !== "production") {
  globalThis.spendlyDb = db;
}

export default db;
