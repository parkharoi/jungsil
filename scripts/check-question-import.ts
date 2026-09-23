import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { eq } from "drizzle-orm";
import example from "../data/templates/questions.example.json";
import { checkDatabase, importBundle, validateBundle, ValidationError } from "./question-import";
import { examSets, problems } from "../src/db/schema";
import { getDb } from "../src/db";
import { findProblem, getFilterOptions, listProblems } from "../src/lib/problems";
import { POST } from "../src/app/api/problems/[id]/submit/route";

async function main() {
  const root = process.cwd(), temporary = mkdtempSync(join(tmpdir(), "jungsil-import-"));
  const clone = () => structuredClone(example);
  const sqlite = new Database(":memory:"), db = drizzle(sqlite);
  try {
    migrate(db, { migrationsFolder: join(root, "drizzle") });
    migrate(db, { migrationsFolder: join(root, "drizzle") });
    validateBundle(example);
    const bad: [string, (q: ReturnType<typeof clone>) => void][] = [
      ["필수 필드", q => { Reflect.deleteProperty(q.problems[0], "content"); }],
      ["필수 문제 수", q => { Reflect.deleteProperty(q.exam, "questionCount"); }],
      ["중복 번호", q => { q.exam.questionCount = 2; q.problems.push({ ...q.problems[0], content: "다른 내용" }); }],
      ["중복 내용", q => { q.exam.questionCount = 2; q.problems.push({ ...q.problems[0], questionNumber: 2 }); }],
      ["문제 유형", q => { q.problems[0].questionType = "UNKNOWN"; }],
      ["언어", q => { q.problems[0].language = "Unknown"; }],
      ["출처", q => { q.problems[0].sourceType = "OFFICIAL_EXAM"; }],
      ["검수", q => { q.problems[0].verificationStatus = "UNKNOWN"; }],
      ["null 검수", q => { Reflect.set(q.problems[0], "verificationStatus", null); }],
      ["정답", q => { q.problems[0].answer = " "; }],
      ["번호 범위", q => { q.problems[0].questionNumber = 0; }],
      ["문제 수", q => { q.exam.questionCount = 2; }],
      ["복원 출처", q => { q.problems[0].sourceType = "RESTORED_EXAM"; }],
      ["해설", q => { q.problems[0].explanation = " "; }],
      ["검수 메모", q => { q.problems[0].verificationNote = " "; }],
      ["날짜", q => { q.exam.examDate = "2026-02-30"; }],
      ["타입", q => { Reflect.set(q.problems[0], "redistributionAllowed", "true"); }],
      ["URL", q => { Reflect.set(q.problems[0], "sourceUrl", "javascript:alert(1)"); }],
      ["허용 정답", q => { Reflect.set(q.problems[0], "acceptedAnswers", [null]); }],
      ["해시 위조", q => { Reflect.set(q.problems[0], "contentHash", "fake"); }],
    ];
    for (const [name, mutate] of bad) {
      const input = clone(); mutate(input);
      assert.throws(() => importBundle(db, input), ValidationError, name);
      assert.equal(db.select().from(examSets).all().length, 0, `${name}: DB unchanged`);
    }
    const defaults = clone();
    Reflect.deleteProperty(defaults.problems[0], "verificationStatus");
    Reflect.deleteProperty(defaults.problems[0], "redistributionAllowed");
    assert.equal(validateBundle(defaults).problems[0].verificationStatus, "REVIEW_REQUIRED");
    assert.equal(validateBundle(defaults).problems[0].redistributionAllowed, false);
    assert.deepEqual(importBundle(db, example), { inserted: 1, updated: 0, skipped: 0, conflicted: 0 });
    const before = sqlite.serialize();
    checkDatabase(db, validateBundle(example));
    assert.deepEqual(sqlite.serialize(), before);
    assert.deepEqual(importBundle(db, example), { inserted: 0, updated: 0, skipped: 1, conflicted: 0 });
    assert.deepEqual(sqlite.serialize(), before, "repeated import must not update timestamps");
    const metadata = clone(); metadata.problems[0].memoryTip = "수정한 팁";
    assert.equal(importBundle(db, metadata).updated, 1);
    const conflict = structuredClone(metadata); conflict.problems[0].answer = "7";
    assert.equal(importBundle(db, conflict).conflicted, 1);
    assert.equal(db.select().from(problems).get()!.answer, "6");
    assert.equal(db.select().from(problems).get()!.verificationStatus, "CONFLICTED");
    const conflicted = sqlite.serialize();
    assert.equal(importBundle(db, conflict).conflicted, 1);
    assert.deepEqual(sqlite.serialize(), conflicted);
    assert.equal(importBundle(db, example, true).updated, 1);
    const duplicate = clone(); duplicate.exam.examRound = 2;
    assert.throws(() => importBundle(db, duplicate), /다른 문제와 내용이 중복/);
    assert.equal(db.select().from(examSets).all().length, 1);

    // Force a failure after exam upsert to verify the entire transaction rolls back.
    sqlite.exec("CREATE TRIGGER fail_import BEFORE INSERT ON problems BEGIN SELECT RAISE(ABORT, 'test rollback'); END");
    duplicate.problems[0].content = "새로운 자체 제작 문제";
    const rollbackBefore = sqlite.serialize();
    assert.throws(() => importBundle(db, duplicate), /test rollback/);
    assert.deepEqual(sqlite.serialize(), rollbackBefore);
    sqlite.exec("DROP TRIGGER fail_import");
    console.log("PASS: validation, readonly checks, idempotence, updates, conflict preservation/resolution, rollback.");

    const legacy = new Database(":memory:");
    try {
      legacy.exec(readFileSync(join(root, "drizzle/0000_mean_blonde_phantom.sql"), "utf8"));
      legacy.exec(readFileSync(join(root, "drizzle/0001_nice_reavers.sql"), "utf8"));
      legacy.prepare("INSERT INTO problems (id,title,content,answer,explanation,question_type,topic,difficulty,source_type,source_name,accepted_answers) VALUES (?,?,?,?,?,?,?,?,?,?,?)")
        .run("legacy", "기존 제목", "기존 내용", "답", "해설", "SHORT_ANSWER", "주제", "EASY", "GAMJA_REFERENCE", "기존 출처", '["다른 답"]');
      const old = legacy.prepare("SELECT * FROM problems").get() as Record<string, unknown>;
      for (const file of readdirSync(join(root, "drizzle")).filter(f => /^0002.*\.sql$/.test(f))) legacy.exec(readFileSync(join(root, "drizzle", file), "utf8"));
      const row = legacy.prepare("SELECT * FROM problems").get() as Record<string, unknown>;
      for (const [key, value] of Object.entries(old)) assert.deepEqual(row[key], value, `legacy ${key}`);
      assert.equal(row.verification_status, "REVIEW_REQUIRED");
      assert.equal(row.redistribution_allowed, 0);
      assert.deepEqual(legacy.pragma("foreign_key_check"), []);
    } finally { legacy.close(); }

    mkdirSync(join(temporary, "data"));
    const dbPath = join(temporary, "data/jungsil.db");
    const fileDb = new Database(dbPath);
    migrate(drizzle(fileDb), { migrationsFolder: join(root, "drizzle") });
    fileDb.close();
    const examplePath = join(root, "data/templates/questions.example.json");
    const cli = (mode: string, file = examplePath) => spawnSync(process.execPath, [join(root, "node_modules/tsx/dist/cli.mjs"), join(root, "scripts/questions.ts"), mode, "--file", file], { cwd: temporary, encoding: "utf8" });
    const emptyBefore = readFileSync(dbPath);
    const validated = cli("validate"); assert.equal(validated.status, 0, validated.stderr);
    assert.deepEqual(readFileSync(dbPath), emptyBefore);
    assert.equal(cli("import").status, 0);
    assert.match(cli("import").stdout, /"skipped":1/);
    const badFile = join(temporary, "invalid.json"); writeFileSync(badFile, '{"exam":{}}');
    const fileBefore = readFileSync(dbPath);
    assert.equal(cli("import", badFile).status, 1);
    assert.deepEqual(readFileSync(dbPath), fileBefore);
    assert.equal(spawnSync("git", ["check-ignore", "data/private/test.json"], { cwd: root }).status, 0);
    assert.equal(spawnSync("git", ["check-ignore", "data/templates/questions.example.json"], { cwd: root }).status, 1);
    console.log("PASS: legacy preservation, CLI validation/import, file immutability, Git exclusions.");

    process.chdir(temporary);
    const connection = getDb();
    const row = connection.select().from(problems).get()!;
    assert.equal(findProblem(row.id)?.code, example.problems[0].code);
    assert.ok(!Object.hasOwn(findProblem(row.id)!, "answer"));
    const request = () => new Request("http://localhost/submit", { method: "POST", body: JSON.stringify({ userAnswer: "6" }) });
    const context = { params: Promise.resolve({ id: row.id }) };
    assert.equal((await (await POST(request(), context)).json()).correct, true);
    for (const status of ["DRAFT", "REVIEW_REQUIRED", "CONFLICTED"] as const) {
      connection.update(problems).set({ verificationStatus: status }).where(eq(problems.id, row.id)).run();
      assert.equal(findProblem(row.id), undefined);
      assert.deepEqual(listProblems(new URLSearchParams()), []);
      assert.deepEqual(getFilterOptions().topic, []);
      assert.equal((await POST(request(), context)).status, 404);
    }
    connection.$client.close();
    console.log("PASS: verified-only list/detail/filter/submission, code visibility, answer secrecy.");
  } finally {
    process.chdir(root);
    sqlite.close();
    // Only remove this test's freshly created directory within the OS temp directory.
    assert.equal(resolve(temporary).startsWith(resolve(tmpdir()) + sep), true);
    rmSync(temporary, { recursive: true, force: true });
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
