import { readFileSync, statSync } from "node:fs";
import { parseArgs } from "node:util";
import { join } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { checkDatabase, importBundle, validateBundle, ValidationError } from "./question-import";

try {
  const { values, positionals } = parseArgs({ options: { file: { type: "string" }, "resolve-conflicts": { type: "boolean", default: false } }, allowPositionals: true });
  const mode = positionals[0];
  if (positionals.length !== 1 || !["validate", "import"].includes(mode) || !values.file || (mode === "validate" && values["resolve-conflicts"])) throw new Error("사용법: questions.ts validate|import --file <JSON> [--resolve-conflicts (import 전용)]");
  if (statSync(values.file).size > 10 * 1024 * 1024) throw new Error("JSON 파일은 10 MiB 이하여야 합니다.");
  const input: unknown = JSON.parse(readFileSync(values.file, "utf8").replace(/^\uFEFF/, ""));
  const bundle = validateBundle(input);
  const sqlite = new Database(join(process.cwd(), "data", "jungsil.db"), { readonly: mode === "validate", fileMustExist: true });
  try {
    const db = drizzle(sqlite);
    if (mode === "validate") {
      checkDatabase(db, bundle);
      console.log(`검증 성공: ${bundle.problems.length}문제. DB 변경 없음.`);
    } else {
      sqlite.pragma("foreign_keys = ON");
      const counts = importBundle(db, input, values["resolve-conflicts"]);
      console.log(JSON.stringify(counts));
      if (counts.conflicted) console.log("충돌 문제의 기존 내용·정답은 보존되며 풀이에서 숨겨집니다. 원본 JSON과 출처를 검토하세요.");
    }
  } finally { sqlite.close(); }
} catch (error) {
  console.error(error instanceof ValidationError ? error.errors.join("\n") : error instanceof Error ? error.message : "Import 실패");
  console.error("DB가 없거나 스키마가 오래되었다면 npm run db:migrate를 먼저 실행하세요.");
  process.exitCode = 1;
}
