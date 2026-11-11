import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { examSets, problems, problemAttempts, type AnswerPart } from "../src/db/schema";
import { findProblem, listProblems } from "../src/lib/problems";
import { listWrongAnswers } from "../src/lib/reviews";
import { POST } from "../src/app/api/problems/[id]/submit/route";
import { examProgress, importBundle, validateBundle, ValidationError } from "./question-import";
import example from "../data/templates/questions.example.json";

async function main() {
  const root = process.cwd(), temporary = mkdtempSync(join(tmpdir(), "jungsil-question-types-"));
  const oldFolder = join(temporary, "old-migrations");
  mkdirSync(join(oldFolder, "meta"), { recursive: true });
  const journal = JSON.parse(readFileSync(join(root, "drizzle/meta/_journal.json"), "utf8"));
  journal.entries = journal.entries.filter((entry: { idx: number }) => entry.idx < 4);
  writeFileSync(join(oldFolder, "meta/_journal.json"), JSON.stringify(journal));
  for (const entry of journal.entries) copyFileSync(join(root, "drizzle", entry.tag + ".sql"), join(oldFolder, entry.tag + ".sql"));
  process.chdir(temporary);
  const sqlite = getDb().$client, db = drizzle(sqlite);
  try {
    migrate(db, { migrationsFolder: oldFolder });
    sqlite.prepare("INSERT INTO exam_sets(id,certification,exam_year,exam_round,exam_date,title,question_count,source_type) VALUES('legacy-exam','TEST',2025,1,'2025-01-01','Legacy',1,'MANUAL')").run();
    sqlite.prepare("INSERT INTO problems(id,exam_set_id,question_number,title,content,answer,explanation,question_type,topic,difficulty,source_type,source_name) VALUES('legacy','legacy-exam',1,'Legacy','Old content','20','Old explanation','CODE_OUTPUT','TEST','EASY','MANUAL','TEST')").run();
    for (const [id, correct, score] of [["a", 0, 0], ["b", 1, 5]] as const) {
      sqlite.prepare("INSERT INTO problem_attempts(id,problem_id,user_answer,correct,score,submitted_at) VALUES(?,'legacy','20',?,?,1000)").run(id, correct, score);
    }
    const before = Object.fromEntries(["exam_sets", "problems", "problem_attempts", "__drizzle_migrations"].map(table => [table, sqlite.prepare(`SELECT rowid, * FROM ${table} ORDER BY rowid`).all() as Record<string, unknown>[]]));
    const sql = readFileSync(join(root, "drizzle/0004_question_types.sql"), "utf8");
    assert.doesNotMatch(sql, /DROP\s+TABLE|DELETE\s+FROM|INSERT\s+INTO|writable_schema|foreign_keys\s*=\s*OFF/i);
    migrate(db, { migrationsFolder: join(root, "drizzle") });
    for (const [table, rows] of Object.entries(before)) {
      const after = sqlite.prepare(`SELECT rowid, * FROM ${table} ORDER BY rowid`).all() as Record<string, unknown>[];
      assert.equal(after.length, rows.length + (table === "__drizzle_migrations" ? 1 : 0));
      rows.forEach((row, index) => Object.entries(row).forEach(([key, value]) => assert.deepEqual(after[index][key], value, `${table}.${key}`)));
    }
    assert.equal(sqlite.prepare("SELECT legacy_question_type FROM problems WHERE id='legacy'").get() && db.select().from(problems).get()!.answerParts, null);
    assert.deepEqual(sqlite.pragma("foreign_key_check"), []);
    assert.equal(sqlite.pragma("foreign_keys", { simple: true }), 1);
    assert.throws(() => sqlite.prepare("DELETE FROM problems WHERE id='legacy'").run(), /FOREIGN KEY/);
    const afterMigration = sqlite.serialize();
    migrate(db, { migrationsFolder: join(root, "drizzle") });
    assert.deepEqual(sqlite.serialize(), afterMigration);
    console.log("PASS: additive migration preserves every old value, rowid, FK, index and migration history; no table rebuild.");

    const parts: AnswerPart[] = [{ key: "①", label: "첫 빈칸", answer: "LIKE", acceptedAnswers: ["ILIKE"] }, { key: "②", answer: "DESC" }];
    const make = (type: "SQL_BLANK" | "CODE_BLANK", answerParts = parts) => db.insert(problems).values({
      title: type, content: "( ① ) ( ② )", code: "SELECT ( ① ) ORDER BY ( ② )", answer: "legacy summary", answerParts,
      explanation: "SECRET explanation", questionType: type, topic: "BLANK_TEST", difficulty: "EASY", language: type === "SQL_BLANK" ? "SQL" : "C",
      sourceType: "MANUAL", sourceName: "TEST_ONLY", verificationStatus: "VERIFIED",
    }).returning().get();
    const multi = make("SQL_BLANK"), single = make("SQL_BLANK", [parts[0]]), code = make("CODE_BLANK");
    const submit = (id: string, body: unknown) => POST(new Request("http://localhost/submit", { method: "POST", body: JSON.stringify(body) }), { params: Promise.resolve({ id }) });
    for (const problem of [multi, single, code]) {
      const safe = JSON.stringify(findProblem(problem.id));
      for (const secret of ["LIKE", "ILIKE", "DESC", "SECRET", "legacy summary"]) assert.ok(!safe.includes(secret), secret);
      assert.equal(findProblem(problem.id)!.answerParts!.length, problem.answerParts!.length);
      assert.ok(listProblems(new URLSearchParams({ questionType: problem.questionType })).some(row => row.id === problem.id));
      const answer = Object.fromEntries(problem.answerParts!.map(part => [part.key, "  " + part.answer.toLowerCase() + "  "]));
      const response = await submit(problem.id, { userAnswers: answer });
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(result.correct, true); assert.equal(result.score, 5);
      assert.equal(result.correctParts, problem.answerParts!.length);
      assert.equal(result.totalParts, problem.answerParts!.length);
      assert.equal(db.select().from(problemAttempts).where(eq(problemAttempts.id, result.attemptId)).get()!.userAnswer, JSON.stringify(answer));
    }
    const accepted = await (await submit(multi.id, { userAnswers: { "②": "DESC", "①": " ilike " } })).json();
    assert.equal(accepted.correct, true);
    assert.equal(accepted.userAnswer, JSON.stringify({ "①": " ilike ", "②": "DESC" }));
    const wrong = await (await submit(multi.id, { userAnswers: { "①": "LIKE", "②": "ASC" } })).json();
    assert.equal(wrong.correct, false); assert.equal(wrong.score, 0); assert.equal(wrong.correctParts, 1);
    const count = db.select().from(problemAttempts).all().length;
    for (const body of [{}, { userAnswer: "LIKE" }, { userAnswers: [] }, { userAnswers: { "①": "LIKE" } },
      { userAnswers: { "①": "LIKE", "②": " " } }, { userAnswers: { "①": "LIKE", "②": 1 } },
      { userAnswers: { "①": "LIKE", "③": "DESC" } }, { userAnswers: { "①": "LIKE", "②": "DESC", "③": "X" } },
      { userAnswers: { "①": "x".repeat(10001), "②": "DESC" } }, { userAnswer: "x", userAnswers: { "①": "LIKE", "②": "DESC" } }]) {
      assert.equal((await submit(multi.id, body)).status, 400);
    }
    assert.equal((await submit("not-found", { userAnswers: { "①": "LIKE" } })).status, 404);
    assert.equal(db.select().from(problemAttempts).all().length, count);
    const review = listWrongAnswers(new URLSearchParams({ topic: "BLANK_TEST" }))[0];
    assert.deepEqual(review.results, wrong.results); assert.equal(review.latestWrongCorrect, false);
    for (const state of ["REVIEWING", "MASTERED"]) {
      const result = await (await submit(multi.id, { userAnswers: { "①": "LIKE", "②": "DESC" }, attemptContext: "WRONG_ANSWER_RETRY" })).json();
      assert.equal(result.reviewStatus, state);
    }
    console.log("PASS: SQL/CODE blank grading, normalization, accepted answers, exact keys, rejection without writes, secrecy, deterministic JSON, notebook and retry.");

    const bundle = { exam: { ...example.exam, certification: "PARTIAL_TEST", questionCount: 20, verificationStatus: "VERIFIED" },
      problems: [1, 3, 8].map(questionNumber => ({ ...example.problems[0], questionNumber, questionType: "SQL_BLANK", content: `Test ${questionNumber}: ( ① )`, code: null, answerParts: [structuredClone(parts[0])] })) };
    validateBundle(bundle);
    const invalid = (mutate: (value: typeof bundle) => void) => { const value = structuredClone(bundle); mutate(value); assert.throws(() => validateBundle(value), ValidationError); };
    invalid(q => { Reflect.set(q.problems[0], "answerParts", {}); });
    invalid(q => { q.problems[0].answerParts = []; });
    invalid(q => { q.problems[0].answerParts.push(q.problems[0].answerParts[0]); });
    invalid(q => { q.problems[0].answerParts[0].key = " "; });
    invalid(q => { q.problems[0].answerParts[0].answer = " "; });
    invalid(q => { Reflect.set(q.problems[0].answerParts[0], "acceptedAnswers", [3]); });
    invalid(q => { q.problems[0].content = "No markers"; });
    invalid(q => { q.problems[0].content += " ( ② )"; });
    invalid(q => { q.problems[0].questionType = "SHORT_ANSWER"; });
    invalid(q => { q.problems[0].questionNumber = 21; });
    invalid(q => { q.problems[1].questionNumber = 1; });
    assert.equal(importBundle(db, bundle).inserted, 3);
    const validated = validateBundle(bundle);
    let progress = examProgress(db, validated.exam);
    assert.deepEqual(progress.missingNumbers, [2, 4, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    const exam = db.select().from(examSets).where(eq(examSets.certification, "PARTIAL_TEST")).get()!;
    assert.equal(exam.verificationStatus, "REVIEW_REQUIRED");
    const original = db.select().from(problems).where(eq(problems.examSetId, exam.id)).all();
    const file = join(temporary, "partial.json"); writeFileSync(file, JSON.stringify(bundle));
    const cli = (mode: string) => spawnSync(process.execPath, [join(root, "node_modules/tsx/dist/cli.mjs"), join(root, "scripts/questions.ts"), mode, "--file", file], { cwd: temporary, encoding: "utf8" });
    const validation = cli("validate"); assert.equal(validation.status, 0, validation.stderr); assert.match(validation.stdout, /2, 4, 5/);
    const imported = cli("import"); assert.equal(imported.status, 0, imported.stderr); assert.match(imported.stdout, /등록 3\/20, 누락 17문항/);
    assert.equal(importBundle(db, bundle).skipped, 3);
    const remainder = { exam: bundle.exam, problems: progress.missingNumbers.map(questionNumber => ({ ...bundle.problems[0], questionNumber, content: `Test ${questionNumber}: ( ① )`, verificationStatus: "REVIEW_REQUIRED" })) };
    assert.equal(importBundle(db, remainder).inserted, 17);
    progress = examProgress(db, validated.exam);
    assert.equal(progress.registered, 20); assert.deepEqual(progress.missingNumbers, []);
    assert.equal(progress.verified, 3); assert.equal(progress.reviewRequired, 17);
    assert.equal(db.select().from(examSets).where(eq(examSets.id, exam.id)).get()!.verificationStatus, "REVIEW_REQUIRED");
    for (const row of original) assert.deepEqual(db.select().from(problems).where(eq(problems.id, row.id)).get(), row);
    for (const row of remainder.problems) row.verificationStatus = "VERIFIED";
    importBundle(db, remainder);
    assert.equal(db.select().from(examSets).where(eq(examSets.id, exam.id)).get()!.verificationStatus, "VERIFIED");
    const full = { exam: bundle.exam, problems: [...bundle.problems, ...remainder.problems] };
    assert.equal(importBundle(db, full).skipped, 20);
    const second = { exam: { ...full.exam, certification: "FULL_TEST" }, problems: full.problems.map(q => ({ ...q, content: "Second " + q.content })) };
    assert.equal(importBundle(db, second).inserted, 20);
    const conflicting = structuredClone(bundle); conflicting.problems[0].answerParts[0].answer = "CHANGED";
    assert.equal(importBundle(db, conflicting).conflicted, 1);
    assert.equal(examProgress(db, validated.exam).conflicted, 1);
    assert.equal(db.select().from(examSets).where(eq(examSets.id, exam.id)).get()!.verificationStatus, "REVIEW_REQUIRED");
    assert.equal(db.select().from(problems).where(eq(problems.id, original[0].id)).get()!.answerParts![0].answer, "LIKE");
    console.log("PASS: blank import validation, partial/full 20, missing-number CLI, fill-in without deleting old rows, idempotence, review gates and conflict preservation.");
  } finally {
    sqlite.close(); process.chdir(root);
    assert.ok(resolve(temporary).startsWith(resolve(tmpdir()) + sep));
    rmSync(temporary, { recursive: true, force: true });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
