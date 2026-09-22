import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getDb } from "../src/db";

const db = getDb();
try {
  migrate(db, { migrationsFolder: "./drizzle" });
  console.log("Database migrations applied: data/jungsil.db");
} finally {
  db.$client.close();
}
