import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import Database from "better-sqlite3";

async function main() {
  const source = new Database(resolve("data/jungsil.db"), { readonly: true, fileMustExist: true });
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace("T", "-").replace(/\.\d+Z$/, "");
  mkdirSync("data/backups", { recursive: true });
  const destination = resolve(`data/backups/jungsil-before-attempts-${stamp}-${crypto.randomUUID().slice(0, 8)}.db`);
  try {
    await source.backup(destination);
    const backup = new Database(destination, { readonly: true, fileMustExist: true });
    try {
      assert.deepEqual(backup.pragma("integrity_check"), [{ integrity_check: "ok" }]);
      const schema = "SELECT type, name, tbl_name, sql FROM sqlite_master ORDER BY type, name";
      assert.deepEqual(backup.prepare(schema).all(), source.prepare(schema).all());
      const tables = source.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as { name: string }[];
      for (const { name } of tables) {
        const query = `SELECT * FROM "${name.replaceAll('"', '""')}" ORDER BY rowid`;
        const rows = source.prepare(query).all();
        assert.deepEqual(backup.prepare(query).all(), rows, name);
        console.log(`${name}: ${rows.length} rows identical`);
      }
      console.log(`VERIFIED BACKUP: ${destination}`);
    } finally { backup.close(); }
  } finally { source.close(); }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
