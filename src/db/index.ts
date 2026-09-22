import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

let database: ReturnType<typeof drizzle> | undefined;

export function getDb() {
  if (!database) {
    const directory = join(process.cwd(), "data");
    mkdirSync(directory, { recursive: true });
    const sqlite = new Database(join(directory, "jungsil.db"));
    sqlite.pragma("journal_mode = WAL");
    database = drizzle(sqlite);
  }
  return database;
}
