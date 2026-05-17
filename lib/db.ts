import "server-only";

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

db.exec(`
  CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    createdAt TEXT NOT NULL
  )
`);

if (process.env.NODE_ENV !== "production") {
  globalThis.spendlyDb = db;
}

export default db;
