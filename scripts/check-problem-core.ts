import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { eq } from "drizzle-orm";
import { problems, type Problem } from "../src/db/schema";
import { getDb } from "../src/db";
import { GET as listRoute } from "../src/app/api/problems/route";
import { GET as detailRoute } from "../src/app/api/problems/[id]/route";
import { POST as submitRoute } from "../src/app/api/problems/[id]/submit/route";
import { gradeAnswer } from "../src/lib/grading";
import { readFileSync } from "node:fs";

const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
type PublicProblem = Omit<Problem, "answer" | "acceptedAnswers" | "explanation">;

function assertPublic(problem: object) {
  for (const key of ["answer", "acceptedAnswers", "explanation"]) {
    assert.equal(Object.hasOwn(problem, key), false, `${key} must not be exposed`);
  }
}

function submitRequest(id: string, body: unknown) {
  return new Request(`${base}/api/problems/${id}/submit`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

async function main() {
  const response = await fetch(`${base}/api/problems`);
  assert.equal(response.status, 200);
  const all: PublicProblem[] = await response.json();
  all.forEach(assertPublic);
  const samples = all.filter((row) => row.id.startsWith("sample-"));
  assert.equal(samples.length, 5);
  for (const row of samples) {
    assert.equal(row.sourceType, "SAMPLE");
    assert.equal(row.sourceName, "JungSil Sample");
    assert.equal(row.sourceUrl, null);
    assert.equal(row.sourceYear, null);
    assert.equal(row.sourceRound, null);
    assert.ok(row.createdAt && row.updatedAt);
    const detail = await fetch(`${base}/api/problems/${row.id}`);
    assert.equal(detail.status, 200);
    assert.deepEqual(await detail.json(), row);
    const page = await fetch(`${base}/problems/${row.id}`);
    assert.equal(page.status, 200);
    const html = await page.text();
    assert.ok(html.includes(row.title));
    assert.ok(html.includes("JungSil Sample"));
    assert.ok(html.includes("내 답안") && html.includes("제출하기"));
    assert.ok(!html.includes('id="answer-heading"') && !html.includes('id="explanation-heading"'));
    const stored = getDb().select().from(problems).where(eq(problems.id, row.id)).get()!;
    assert.ok(!html.includes(stored.explanation), "Initial HTML must not contain the explanation");
    const rsc = await (await fetch(`${base}/problems/${row.id}`, { headers: { RSC: "1" } })).text();
    assert.ok(!rsc.includes(stored.explanation), "RSC payload must not contain the explanation");
    const correct = await fetch(submitRequest(row.id, { userAnswer: `  ${stored.answer.toUpperCase().replace(/\n/g, "\r\n")}  ` }));
    assert.equal(correct.status, 200);
    const result = await correct.json();
    assert.equal(result.correct, true);
    assert.equal(result.correctAnswer, stored.answer);
    assert.equal(result.explanation, stored.explanation);
    assert.equal(result.userAnswer, `  ${stored.answer.toUpperCase().replace(/\n/g, "\r\n")}  `);
    assert.deepEqual(Object.keys(result).sort(), ["correct", "correctAnswer", "explanation", "userAnswer"]);
    const wrong = await fetch(submitRequest(row.id, { userAnswer: "틀린 답안" }));
    assert.equal(wrong.status, 200);
    assert.equal((await wrong.json()).correct, false);
  }
  for (const body of [{}, { userAnswer: "" }, { userAnswer: " \t\r\n " }, { userAnswer: 20 }, { userAnswer: null }, { userAnswer: [] }, { userAnswer: "x".repeat(10001) }, null, []]) {
    assert.equal((await fetch(submitRequest("sample-java-loop", body))).status, 400);
  }
  assert.equal((await fetch(`${base}/api/problems/sample-java-loop/submit`, { method: "POST", body: "{" })).status, 400);
  assert.equal((await fetch(`${base}/api/problems/sample-java-loop/submit`, { method: "POST" })).status, 400);
  assert.equal((await fetch(submitRequest("missing-problem", { userAnswer: "20" }))).status, 404);
  for (const field of ["questionType", "topic", "difficulty", "language"] as const) {
    for (const value of new Set(all.map((row) => row[field]).filter((v) => v !== null))) {
      const filtered = await fetch(`${base}/api/problems?${new URLSearchParams({ [field]: value })}`);
      assert.equal(filtered.status, 200);
      assert.deepEqual(await filtered.json(), all.filter((row) => row[field] === value));
    }
  }
  const combined = new URLSearchParams({ questionType: "CODE_OUTPUT", topic: "반복문", difficulty: "EASY", language: "Java" });
  const combinedResponse = await fetch(`${base}/api/problems?${combined}`);
  assert.equal(combinedResponse.status, 200);
  assert.deepEqual((await combinedResponse.json()).map((row: Problem) => row.id), ["sample-java-loop"]);
  const empty = await fetch(`${base}/api/problems?questionType=NORMALIZATION&language=Java`);
  assert.equal(empty.status, 200);
  assert.deepEqual(await empty.json(), []);
  const unfiltered = await fetch(`${base}/api/problems?questionType=&topic=&difficulty=&language=`);
  assert.equal(unfiltered.status, 200);
  assert.deepEqual(await unfiltered.json(), all);
  for (const query of ["questionType=INVALID", "difficulty=INVALID", "language=INVALID", "topic=INVALID", "unknown=x", "difficulty=EASY&difficulty=HARD", "topic=%27%20OR%201%3D1--"]) {
    const invalid = await fetch(`${base}/api/problems?${query}`);
    assert.equal(invalid.status, 400, query);
    assert.equal(typeof (await invalid.json()).error, "string");
  }
  assert.equal((await fetch(`${base}/api/problems/missing-problem`)).status, 404);
  assert.equal((await fetch(`${base}/api/problems/%27%20OR%201%3D1--`)).status, 404);
  const page = await fetch(`${base}/problems`);
  assert.equal(page.status, 200);
  const html = await page.text();
  for (const row of samples) assert.ok(html.includes(row.title));
  const filteredHtml = await (await fetch(`${base}/problems?${combined}`)).text();
  assert.ok(filteredHtml.includes("Java 반복문의 누적 합"));
  assert.ok(!filteredHtml.includes("C 배열과 포인터"));
  const invalidHtml = await (await fetch(`${base}/problems?difficulty=INVALID`)).text();
  assert.ok(invalidHtml.includes('role="alert"'));
  const missingHtml = await (await fetch(`${base}/problems/missing-problem`)).text();
  assert.ok(missingHtml.includes("문제를 찾을 수 없습니다."));
  console.log("PASS: sample metadata, list/detail API, all filters, combined/empty filters, 400/404, list/detail pages.");

  // Check constraints and timestamps without modifying the user's database.
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite);
  try {
    migrate(db, { migrationsFolder: "./drizzle" });
    migrate(db, { migrationsFolder: "./drizzle" });
    const sample = { ...getDb().select().from(problems).where(eq(problems.id, samples[0].id)).get()!, createdAt: undefined, updatedAt: undefined };
    const inserted = db.insert(problems).values(sample).returning().get();
    assert.ok(inserted.createdAt instanceof Date);
    assert.ok(inserted.updatedAt instanceof Date);
    for (const column of ["question_type", "difficulty", "source_type"]) {
      assert.throws(() => sqlite.prepare(`UPDATE problems SET ${column} = ?`).run("INVALID"), /CHECK constraint/);
    }
    sqlite.prepare("UPDATE problems SET updated_at = 0").run();
    db.update(problems).set({ title: "Updated" }).where(eq(problems.id, inserted.id)).run();
    assert.ok(db.select().from(problems).get()!.updatedAt.getTime() > 0);
    assert.equal(db.insert(problems).values(sample).onConflictDoNothing().run().changes, 0);
  } finally {
    sqlite.close();
  }
  console.log("PASS: repeatable migration, DB enum constraints, timestamp defaults/update, duplicate prevention.");

  // Verify the actual additive migration preserves a row created with the old schema.
  const legacy = new Database(":memory:");
  try {
    legacy.exec(readFileSync("drizzle/0000_mean_blonde_phantom.sql", "utf8"));
    legacy.prepare("INSERT INTO problems (id, title, content, answer, explanation, question_type, topic, difficulty, source_type, source_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run("legacy", "기존 문제", "내용", "20", "기존 해설", "CODE_OUTPUT", "반복문", "EASY", "SAMPLE", "JungSil Sample");
    const before = legacy.prepare("SELECT * FROM problems").get();
    legacy.exec(readFileSync("drizzle/0001_nice_reavers.sql", "utf8"));
    assert.deepEqual(legacy.prepare("SELECT * FROM problems").get(), { ...before as object, accepted_answers: null });
  } finally {
    legacy.close();
  }

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

  // The fixture is only visible to this test connection and is always rolled back.
  const connection = getDb();
  connection.$client.exec("BEGIN");
  try {
    const fixture = connection.insert(problems).values({
      verificationStatus: "VERIFIED", verificationNote: "검증용",
      title: "채점 검증", content: "약어를 입력하세요.", answer: "Denial of Service",
      acceptedAnswers: ["DoS", "서비스 거부 공격"], explanation: "검증용 해설",
      questionType: "SHORT_ANSWER", topic: "보안", difficulty: "EASY", sourceType: "SAMPLE", sourceName: "Test",
    }).returning().get();
    const context = { params: Promise.resolve({ id: fixture.id }) };
    const publicResponse = await detailRoute(new Request(`${base}/api/problems/${fixture.id}`), context);
    assertPublic(await publicResponse.json());
    for (const userAnswer of [" dos ", "서비스 거부 공격"]) {
      const accepted = await submitRoute(submitRequest(fixture.id, { userAnswer }), context);
      assert.equal(accepted.status, 200);
      assert.deepEqual(await accepted.json(), { correct: true, userAnswer, correctAnswer: fixture.answer, explanation: fixture.explanation });
    }
  } finally {
    connection.$client.exec("ROLLBACK");
  }
  console.log("PASS: secret-free GET/HTML/RSC, submission true/false/400/404, normalization, accepted answers, legacy migration preservation.");

  // Close only this test process's connection to simulate DB failure safely.
  getDb().$client.close();
  const failureResponses = [
    listRoute(new Request(`${base}/api/problems`)),
    await detailRoute(new Request(`${base}/api/problems/sample-java-loop`), { params: Promise.resolve({ id: "sample-java-loop" }) }),
  ];
  for (const failure of failureResponses) {
    assert.equal(failure.status, 500);
    assert.deepEqual(await failure.json(), { error: "문제를 불러오지 못했습니다." });
  }
  console.log("PASS: both API handlers return sanitized 500 responses on database failure.");
  const submitFailure = await submitRoute(submitRequest("sample-java-loop", { userAnswer: "20" }), { params: Promise.resolve({ id: "sample-java-loop" }) });
  assert.equal(submitFailure.status, 500);
  assert.deepEqual(await submitFailure.json(), { error: "답안을 채점하지 못했습니다." });
  console.log("PASS: submission handler returns a sanitized 500 response.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
