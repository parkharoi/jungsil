import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getDb } from "../src/db";
import { examSets, problems, problemAttempts, type Problem } from "../src/db/schema";
import { getReviewState, getWrongSummary, listWrongAnswers } from "../src/lib/reviews";
import { getWeaknesses } from "../src/lib/weaknesses";
import { POST } from "../src/app/api/problems/[id]/submit/route";
import { GET as wrongRoute } from "../src/app/api/wrong-answers/route";
import { GET as statsRoute } from "../src/app/api/stats/weaknesses/route";

async function main() {
  const root = process.cwd(), temporary = mkdtempSync(join(tmpdir(), "jungsil-learning-test-"));
  process.chdir(temporary);
  const db = getDb();
  try {
    migrate(db, { migrationsFolder: join(root, "drizzle") });
    const request = (path: string) => new Request("http://localhost" + path);
    assert.deepEqual(listWrongAnswers(new URLSearchParams()), []);
    assert.deepEqual(getWrongSummary(), { total: 0, notReviewed: 0, reviewing: 0, mastered: 0, mostWrongTopic: null });
    const empty = getWeaknesses();
    assert.equal(empty.totalAttempts, 0); assert.equal(empty.accuracy, 0);
    assert.equal(empty.recommendations.length, 0);
    const create = (topic: string, extra: Partial<typeof problems.$inferInsert> = {}) => db.insert(problems).values({
      title: "TEST_ONLY " + topic, content: "Test", answer: "DoS", acceptedAnswers: ["Denial of Service"],
      explanation: "TEST_SECRET", questionType: "SHORT_ANSWER", topic, subTopic: "sub " + topic,
      language: "C", difficulty: "EASY", sourceType: "MANUAL", sourceName: "AUTOMATED_TEST_ONLY",
      verificationStatus: "VERIFIED", ...extra,
    }).returning().get();
    const submit = async (id: string, correct: boolean, attemptContext = "PRACTICE") => {
      const response = await POST(new Request("http://localhost/submit", { method: "POST", body: JSON.stringify({ userAnswer: correct ? " dos " : "wrong", attemptContext }) }), { params: Promise.resolve({ id }) });
      assert.equal(response.status, 200);
      return response.json();
    };
    const problem = create("review");
    const byId = () => listWrongAnswers(new URLSearchParams({ topic: "review" }))[0];
    await submit(problem.id, false);
    assert.equal(byId().reviewStatus, "NOT_REVIEWED");
    await submit(problem.id, false);
    assert.equal(listWrongAnswers(new URLSearchParams()).length, 1);
    assert.equal(byId().wrongCount, 2);
    assert.equal(byId().correctAnswer, "DoS"); assert.equal(byId().explanation, "TEST_SECRET");
    await submit(problem.id, true);
    assert.equal(byId().reviewStatus, "NOT_REVIEWED");
    assert.equal(byId().latestAttemptCorrect, true);
    const reviewing = await submit(problem.id, true, "WRONG_ANSWER_RETRY");
    assert.equal(reviewing.reviewStatus, "REVIEWING");
    assert.equal(reviewing.consecutiveCorrectCount, 1);
    await submit(problem.id, true);
    assert.equal(byId().consecutiveCorrectCount, 1, "Practice success is ignored");
    const mastered = await submit(problem.id, true, "WRONG_ANSWER_RETRY");
    assert.equal(mastered.reviewStatus, "MASTERED");
    assert.equal(mastered.consecutiveCorrectCount, 2);
    assert.equal(getWrongSummary().mastered, 1);
    assert.equal(getWeaknesses().unresolvedWrongProblems, 0);
    await submit(problem.id, false);
    assert.equal(byId().reviewStatus, "NOT_REVIEWED");
    assert.equal(byId().consecutiveCorrectCount, 0);
    await submit(problem.id, true, "WRONG_ANSWER_RETRY");
    await submit(problem.id, false, "WRONG_ANSWER_RETRY");
    assert.equal(byId().reviewStatus, "NOT_REVIEWED");
    assert.equal(byId().latestAttemptCorrect, false);
    assert.equal(byId().totalAttemptCount, 9);
    const beforeInvalid = db.select().from(problemAttempts).all();
    assert.equal((await POST(new Request("http://localhost/submit", { method: "POST", body: JSON.stringify({ userAnswer: "DoS", attemptContext: "INVALID" }) }), { params: Promise.resolve({ id: problem.id }) })).status, 400);
    assert.deepEqual(db.select().from(problemAttempts).all(), beforeInvalid);
    console.log("PASS: one card per problem, practice/retry distinction, review transitions, reset and invalid context.");

    const exam = db.insert(examSets).values({ certification: "TEST", examYear: 2026, examRound: 2, examDate: "2026-01-01", title: "TEST EXAM", questionCount: 1, sourceType: "RESTORED_EXAM" }).returning().get();
    const examProblem = create("SQL", { examSetId: exam.id, questionNumber: 1, sourceType: "RESTORED_EXAM", language: "SQL", sourceYear: 2025, sourceRound: 1 });
    await submit(examProblem.id, false);
    const filters = { sourceType: "RESTORED_EXAM", examYear: "2026", examRound: "2", questionType: "SHORT_ANSWER", topic: "SQL", subTopic: "sub SQL", language: "SQL", reviewStatus: "NOT_REVIEWED" };
    for (const [key, value] of Object.entries(filters)) assert.ok(listWrongAnswers(new URLSearchParams({ [key]: value })).some(r => r.problemId === examProblem.id));
    assert.equal(listWrongAnswers(new URLSearchParams(filters)).length, 1);
    assert.equal(listWrongAnswers(new URLSearchParams(filters))[0].questionNumber, 1);
    assert.equal(listWrongAnswers(new URLSearchParams({ examYear: "2025" })).length, 0);
    assert.equal(listWrongAnswers(new URLSearchParams({ limit: "1", offset: "1" })).length, 1);
    for (const query of ["reviewStatus=INVALID", "sourceType=INVALID", "questionType=INVALID", "examYear=abc", "examRound=-1", "topic=x&topic=y", "offset=-1", "offset=9007199254740992", "unknown=x", "limit=201"]) assert.equal(wrongRoute(request("/api/wrong-answers?" + query)).status, 400);
    assert.deepEqual(listWrongAnswers(new URLSearchParams({ topic: "' OR 1=1--" })), []);
    console.log("PASS: all eight filters, exam metadata, pagination and malformed/injection inputs.");

    const record = (p: Problem, correct: boolean, date = new Date()) => db.insert(problemAttempts).values({ problemId: p.id, userAnswer: correct ? "DoS" : "wrong", correct, score: correct ? 5 : 0, submittedAt: date }).run();
    const sparse = create("sparse", { language: null, subTopic: null });
    for (let i = 0; i < 10; i++) record(sparse, false);
    assert.equal(getWeaknesses().groups.topic.find(r => r.value === "sparse")!.weaknessLevel, "INSUFFICIENT_DATA");
    assert.equal(getWeaknesses().groups.topic.find(r => r.value === "sparse")!.uniqueProblemsSolved, 1);
    assert.ok(listWrongAnswers(new URLSearchParams({ language: "NONE", subTopic: "NONE" })).some(r => r.problemId === sparse.id));
    const makeGroup = (name: string, answers: boolean[], language: string | null = "Java", date = new Date()) => {
      const group = [create(name, { language }), create(name, { language }), create(name, { language })];
      answers.forEach((answer, i) => record(group[i % 3], answer, date));
      return group;
    };
    makeGroup("weak", [true, false, false]);
    makeGroup("caution60", [true, true, false, true, false]);
    makeGroup("good75", [true, true, false, true]);
    makeGroup("focus", [false, false, false, false, false], "Python");
    const old = new Date(Date.now() - 8 * 86400000);
    makeGroup("stale", [true, false, false], "SQL", old);
    const stats = getWeaknesses();
    const level = (topic: string) => stats.groups.topic.find(r => r.value === topic)!.weaknessLevel;
    assert.equal(level("weak"), "WEAK"); assert.equal(level("caution60"), "CAUTION");
    assert.equal(level("good75"), "GOOD"); assert.equal(level("focus"), "FOCUS");
    assert.equal(stats.groups.topic.find(r => r.value === "focus")!.repeatedWrongCount, 2);
    assert.equal(stats.totalAttempts, db.select().from(problemAttempts).all().length);
    assert.equal(stats.totalAttempts, stats.totalCorrect + stats.totalWrong);
    assert.equal(stats.uniqueProblemsSolved, db.select().from(problems).all().length);
    assert.ok(stats.groups.language.some(r => r.value === null));
    assert.equal(stats.recommendations.length, 5);
    assert.ok(stats.recommendations[0].reason.includes("반복 오답"));
    assert.equal(new Set(stats.recommendations.map(r => r.href)).size, stats.recommendations.length);
    assert.equal(getWeaknesses(new URLSearchParams({ limit: "1" })).groups.topic.length, 1);
    for (const query of ["limit=0", "limit=201", "limit=1&limit=2", "topic=x"]) assert.equal(statsRoute(request("/api/stats/weaknesses?" + query)).status, 400);
    assert.equal(statsRoute(request("/api/stats/weaknesses")).status, 200);
    const persistedBeforeReads = db.$client.serialize();
    getWeaknesses(); getWrongSummary(); listWrongAnswers(new URLSearchParams());
    assert.deepEqual(db.$client.serialize(), persistedBeforeReads, "Read APIs must not modify records");
    assert.equal(getReviewState("missing"), null);
    console.log("PASS: unique problem threshold, 60/75 boundaries, repeated wrongs, null language, bounded recommendations and readonly aggregation.");

    // All rows below belong to this isolated temporary database.
    db.delete(problemAttempts).run(); db.delete(problems).run(); db.delete(examSets).run();
    const staleGroup = makeGroup("old-weak-topic", [true, false, false], "SQL", old);
    let recommendations = getWeaknesses().recommendations;
    assert.ok(recommendations.some(r => r.reason.includes("7일")), "Stale weak topics are recommended");
    const candidate = staleGroup[1];
    await submit(candidate.id, true, "WRONG_ANSWER_RETRY");
    recommendations = getWeaknesses().recommendations;
    assert.ok(recommendations.some(r => r.href.includes(candidate.id) && r.reason.includes("1회")));
    assert.ok(!recommendations.some(r => r.reason.includes("7일")), "Recent topic practice removes stale recommendation");
    const once = create("not-reviewed"); record(once, false);
    const orderedCards = listWrongAnswers(new URLSearchParams());
    assert.ok(orderedCards.findIndex(r => r.problemId === once.id) < orderedCards.findIndex(r => r.problemId === candidate.id));
    const tied = create("chronology");
    const time = new Date("2026-01-01T00:00:00Z");
    record(tied, false, time);
    for (let i = 0; i < 2; i++) db.insert(problemAttempts).values({ problemId: tied.id, userAnswer: "DoS", correct: true, score: 5, attemptContext: "WRONG_ANSWER_RETRY", submittedAt: time }).run();
    assert.equal(getReviewState(tied.id)!.reviewStatus, "MASTERED");
    // A backdated insert must not replace a chronologically newer result.
    record(tied, false, new Date("2025-01-01T00:00:00Z"));
    assert.equal(getReviewState(tied.id)!.reviewStatus, "MASTERED");
    console.log("PASS: stale/reviewing recommendations, review priority and chronological/tied ordering.");
  } finally {
    db.$client.close(); process.chdir(root);
    assert.ok(resolve(temporary).startsWith(resolve(tmpdir()) + sep));
    rmSync(temporary, { recursive: true, force: true });
    console.log("CLEANUP: isolated learning test database removed; actual learning database untouched.");
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
