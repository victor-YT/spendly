declare module "better-sqlite3" {
  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  interface Statement {
    run(params?: unknown): RunResult;
    get(...params: unknown[]): unknown;
    all(...params: unknown[]): unknown[];
  }

  class Database {
    constructor(filename: string, options?: { fileMustExist?: boolean });
    pragma(source: string): unknown;
    exec(source: string): this;
    prepare(source: string): Statement;
  }

  namespace Database {
    export { Database };
  }

  export default Database;
}
