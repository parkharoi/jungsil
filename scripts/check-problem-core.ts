import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { eq } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/sqlite-core";
import { getDb } from "../src/db";
import { attemptContexts, examSets, problemAttempts, problems, type Problem } from "../src/db/schema";
import { gradeAnswer } from "../src/lib/grading";
import { GET as list } from "../src/app/api/problems/route";
import { GET as detail } from "../src/app/api/problems/[id]/route";
import { POST as submit } from "../src/app/api/problems/[id]/submit/route";
import { GET as attempts } from "../src/app/api/attempts/route";
import { GET as wrongAnswers } from "../src/app/api/wrong-answers/route";

const request = (path: string) => new Request("http://localhost" + path);
const context = (id: string) => ({ params: Promise.resolve({ id }) });
const post = (id: string, body: unknown) => submit(new Request("http://localhost/submit", {
  method: "POST", body: JSON.stringify(body),
}), context(id));
function assertPublic(value: object) {
  for (const key of ["answer", "acceptedAnswers", "explanation", "memoryTip", "examTip"]) {
    assert.equal(Object.hasOwn(value, key), false, key);
  }
}

async function main() {
  const root = process.cwd();
  const temporary = mkdtempSync(join(tmpdir(), "jungsil-attempts-test-"));
  process.chdir(temporary);
  const db = getDb();
  const sqlite = db.$client;
  try {
    migrate(db, { migrationsFolder: join(root, "drizzle") });
    const fixture = db.insert(problems).values({
      id: "test-attempts-" + crypto.randomUUID(), title: "검증용 문제", content: "약어",
      answer: "Denial of Service", acceptedAnswers: ["DoS"], explanation: "검증용 비공개 해설",
      questionType: "SHORT_ANSWER", topic: "보안", subTopic: "서비스 거부", language: null,
      difficulty: "EASY", sourceType: "MANUAL", sourceName: "AUTOMATED_TEST_ONLY",
      verificationStatus: "VERIFIED", verificationNote: "테스트 전용",
    }).returning().get();
    const before = db.select().from(problems).all();
    migrate(db, { migrationsFolder: join(root, "drizzle") });
    assert.deepEqual(db.select().from(problems).all(), before);
    for (const table of [examSets, problems, problemAttempts]) {
      const config = getTableConfig(table);
      const columns = sqlite.pragma('table_info("' + config.name + '")') as { name: string; type: string; notnull: number }[];
      assert.deepEqual(columns.map(c => [c.name, c.type.toLowerCase(), !!c.notnull]),
        config.columns.map(c => [c.name, c.getSQLType(), c.notNull]));
    }
    assert.equal(sqlite.pragma("foreign_keys", { simple: true }), 1);
    const indexes = sqlite.pragma("index_list(problem_attempts)") as { name: string }[];
    for (const name of ["attempt_problem_idx", "attempt_submitted_idx", "attempt_correct_problem_idx"]) {
      assert.ok(indexes.some(i => i.name === name));
    }
    console.log("PASS: migration repeatability, schema columns, foreign keys and indexes.");

    const count = () => db.select().from(problemAttempts).all().length;
    for (const body of [null, [], {}, { userAnswer: "" }, { userAnswer: " \t\r\n " },
      { userAnswer: 20 }, { userAnswer: "x".repeat(10001) },
      { userAnswer: "DoS", attemptContext: "INVALID" }, { userAnswer: "DoS", startedAt: 123 },
      { userAnswer: "DoS", startedAt: "2026-02-30T00:00:00.000Z" },
      { userAnswer: "DoS", startedAt: "9999-01-01T00:00:00.000Z" }]) {
      assert.equal((await post(fixture.id, body)).status, 400);
    }
    assert.equal((await submit(new Request("http://localhost/submit", { method: "POST", body: "{" }), context(fixture.id))).status, 400);
    assert.equal((await post("missing-problem", { userAnswer: "DoS" })).status, 404);
    assert.equal(count(), 0);
    const startedAt = new Date(Math.floor(Date.now() / 1000) * 1000 - 15000).toISOString();
    const correct = await post(fixture.id, { userAnswer: "  dOs  ", startedAt });
    assert.equal(correct.status, 200);
    const result = await correct.json();
    assert.equal(result.correct, true); assert.equal(result.score, 5);
    assert.equal(result.userAnswer, "  dOs  ");
    assert.equal(result.correctAnswer, fixture.answer); assert.equal(result.explanation, fixture.explanation);
    assert.equal(typeof result.attemptId, "string");
    const saved = db.select().from(problemAttempts).where(eq(problemAttempts.id, result.attemptId)).get()!;
    assert.equal(saved.userAnswer, "  dOs  ");
    assert.equal(saved.attemptContext, "PRACTICE");
    assert.ok(saved.durationSeconds! >= 15);
    assert.equal(saved.durationSeconds, (saved.submittedAt.getTime() - saved.startedAt!.getTime()) / 1000);
    for (const userAnswer of ["wrong one", "wrong two"]) {
      const response = await post(fixture.id, { userAnswer });
      assert.equal(response.status, 200);
      const value = await response.json(); assert.equal(value.correct, false); assert.equal(value.score, 0);
      const row = db.select().from(problemAttempts).where(eq(problemAttempts.id, value.attemptId)).get()!;
      assert.equal(row.startedAt, null); assert.equal(row.durationSeconds, null);
    }
    assert.equal(count(), 3);
    assert.equal(new Set(db.select().from(problemAttempts).all().map(a => a.id)).size, 3);
    assert.throws(() => db.delete(problems).where(eq(problems.id, fixture.id)).run(), /FOREIGN KEY/);
    assert.throws(() => db.insert(problemAttempts).values({ problemId: "missing", userAnswer: "x", correct: false, score: 0 }).run(), /FOREIGN KEY/);
    assert.throws(() => sqlite.prepare("UPDATE problem_attempts SET score = 1").run(), /CHECK/);
    assert.throws(() => sqlite.prepare("UPDATE problem_attempts SET attempt_context = 'INVALID'").run(), /CHECK/);
    assert.throws(() => sqlite.prepare("UPDATE problem_attempts SET duration_seconds = -1").run(), /CHECK/);
    console.log("PASS: correct/wrong/repeated submissions, original answers, timing, invalid requests, deletion restriction.");

    const history = await attempts(request("/api/attempts")).json();
    assert.equal(history.length, 3); assert.equal(history[0].userAnswer, "wrong two");
    assertPublic(history[0].problem);
    assert.equal((await attempts(request("/api/attempts?correct=true")).json()).length, 1);
    assert.equal((await attempts(request("/api/attempts?correct=false&problemId=" + fixture.id)).json()).length, 2);
    assert.deepEqual(await attempts(request("/api/attempts?problemId=missing")).json(), []);
    assert.equal((await attempts(request("/api/attempts?limit=1")).json()).length, 1);
    const wrong = await wrongAnswers(request("/api/wrong-answers")).json();
    assert.equal(wrong.length, 1); assert.equal(wrong[0].wrongCount, 2);
    assert.equal(wrong[0].latestWrongAttempt.userAnswer, "wrong two");
    assert.equal(wrong[0].problem.subTopic, "서비스 거부");
    assert.equal(wrong[0].problem.topic, "보안"); assert.equal(wrong[0].problem.language, null);
    assert.equal(wrong[0].problem.questionType, "SHORT_ANSWER"); assertPublic(wrong[0].problem);
    for (const query of ["limit=0", "limit=201", "limit=1.5", "limit=NaN", "limit=1&limit=2", "unknown=x"]) {
      assert.equal(attempts(request("/api/attempts?" + query)).status, 400);
      assert.equal(wrongAnswers(request("/api/wrong-answers?" + query)).status, 400);
    }
    for (const query of ["correct=1", "correct=", "problemId=", "correct=true&correct=false"]) {
      assert.equal(attempts(request("/api/attempts?" + query)).status, 400);
    }
    for (const attemptContext of attemptContexts) {
      assert.equal((await post(fixture.id, { userAnswer: "DoS", attemptContext })).status, 200);
      assert.equal(db.select().from(problemAttempts).all().at(-1)!.attemptContext, attemptContext);
    }
    // A later correct answer does not erase historical wrong answers.
    assert.equal((await wrongAnswers(request("/api/wrong-answers")).json())[0].wrongCount, 2);
    for (let i = 0; i < 51; i++) {
      db.insert(problemAttempts).values({ problemId: fixture.id, userAnswer: "DoS", correct: true, score: 5 }).run();
    }
    assert.equal((await attempts(request("/api/attempts")).json()).length, 50);
    assert.equal((await attempts(request("/api/attempts?limit=200")).json()).length, count());
    console.log("PASS: attempt filters/limits/order, latest wrong answer/count, all four contexts.");

    const publicRows = await list(request("/api/problems")).json();
    assert.equal(publicRows.length, 1); assertPublic(publicRows[0]);
    assertPublic(await (await detail(request("/api/problems/" + fixture.id), context(fixture.id))).json());
    for (const query of ["topic=" + encodeURIComponent("보안"), "difficulty=EASY", "questionType=SHORT_ANSWER",
      "topic=" + encodeURIComponent("보안") + "&difficulty=EASY&questionType=SHORT_ANSWER", "topic=&language="]) {
      assert.equal((await list(request("/api/problems?" + query)).json()).length, 1);
    }
    assert.equal(list(request("/api/problems?unknown=x")).status, 400);
    assert.equal(list(request("/api/problems?difficulty=INVALID")).status, 400);
    assert.deepEqual(await list(request("/api/problems?questionType=CODE_OUTPUT")).json(), []);
    for (const status of ["DRAFT", "REVIEW_REQUIRED", "CONFLICTED"] as const) {
      db.update(problems).set({ verificationStatus: status }).where(eq(problems.id, fixture.id)).run();
      assert.deepEqual(await list(request("/api/problems")).json(), []);
      assert.equal((await detail(request("/api/problems/" + fixture.id), context(fixture.id))).status, 404);
      const n = count();
      assert.equal((await post(fixture.id, { userAnswer: "DoS" })).status, 404);
      assert.equal(count(), n);
    }
    db.update(problems).set({ verificationStatus: "VERIFIED" }).where(eq(problems.id, fixture.id)).run();
    const n = count();
    sqlite.exec("CREATE TEMP TRIGGER fail_attempt BEFORE INSERT ON problem_attempts BEGIN SELECT RAISE(ABORT, 'test write failure'); END");
    const failure = await post(fixture.id, { userAnswer: "DoS" });
    assert.equal(failure.status, 500);
    assert.deepEqual(await failure.json(), { error: "답안을 채점하지 못했습니다." });
    assert.equal(count(), n);
    assert.deepEqual(sqlite.pragma("foreign_key_check"), []);
    console.log("PASS: list/detail/filter secrecy, verified-only submission, write failure returns 500 without saving.");

    const checks: [Problem["questionType"], string, string, boolean][] = [
      ["SHORT_ANSWER", "DoS", "  dOs  ", true],
      ["SHORT_ANSWER", "Denial of Service", " DENIAL   OF   SERVICE ", true],
      ["CODE_OUTPUT", "A B\nC", " a   b  \r\nc\t  ", true],
      ["CODE_OUTPUT", "A\nB", "B\nA", false],
      ["CODE_OUTPUT", "A\nB", "A B", false],
      ["CODE_OUTPUT", "AB", "A B", false],
      ["CODE_OUTPUT", "A\nB", "A\n\nB", false],
      ["SQL_OUTPUT", "A | 10\nB | 20", " a|10 \r\n\r\n b  |   20 ", true],
      ["SQL_OUTPUT", "A | 10\nB | 20", "A|10 B|20", true],
      ["SQL_OUTPUT", "A | 10\nB | 20", "B | 20\nA | 10", false],
      ["SQL_OUTPUT", "A | 10", "A | 11", false],
      ["NORMALIZATION", "제1정규형", " 제1정규형 ", true],
      ["NETWORK_CALCULATION", "30", " 30 ", true],
    ];
    for (const [questionType, answer, userAnswer, expected] of checks) {
      assert.equal(gradeAnswer({ questionType, answer }, userAnswer), expected, `${questionType}: ${userAnswer}`);
    }
    for (const questionType of ["SHORT_ANSWER", "NORMALIZATION", "NETWORK_CALCULATION"] as const) {
      assert.equal(gradeAnswer({ questionType, answer: "대표 정답", acceptedAnswers: ["대체 표현", "Alternative"] }, " ALTERNATIVE "), true);
      assert.equal(gradeAnswer({ questionType, answer: "대표 정답", acceptedAnswers: null }, "대체 표현"), false);
      assert.equal(gradeAnswer({ questionType, answer: "대표 정답", acceptedAnswers: [] }, "대표 정답"), true);
    }
    assert.equal(gradeAnswer({ questionType: "SHORT_ANSWER", answer: "", acceptedAnswers: [""] }, "  "), false);

    sqlite.close();
    for (const response of [attempts(request("/api/attempts")), wrongAnswers(request("/api/wrong-answers")),
      list(request("/api/problems")), await detail(request("/api/problems/x"), context("x")),
      await post(fixture.id, { userAnswer: "DoS" })]) {
      assert.equal(response.status, 500);
      const error = await response.json();
      assert.equal(typeof error.error, "string"); assert.equal(Object.hasOwn(error, "attemptId"), false);
    }
    console.log("PASS: existing normalization/accepted answers and sanitized database failures.");
  } finally {
    if (sqlite.open) sqlite.close();
    process.chdir(root);
    assert.ok(resolve(temporary).startsWith(resolve(tmpdir()) + sep));
    rmSync(temporary, { recursive: true, force: true });
    console.log("CLEANUP: isolated test database removed; learning database untouched.");
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
