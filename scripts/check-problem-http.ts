import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { problemAttempts, problems } from "../src/db/schema";

async function main() {
  const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
  const db = getDb();
  const id = `test-http-${crypto.randomUUID()}`;
  try {
    db.insert(problems).values({
      id, title: id, content: "HTTP integration fixture", answer: "20",
      explanation: `SECRET-${id}`, questionType: "CODE_OUTPUT", topic: "HTTP_TEST",
      subTopic: "temporary", language: "Java", difficulty: "EASY", sourceType: "MANUAL",
      sourceName: "AUTOMATED_TEST_ONLY", verificationStatus: "VERIFIED",
    }).run();
    const get = async (path: string) => {
      const response = await fetch(base + path);
      assert.equal(response.status, 200, path);
      return response;
    };
    const submit = (userAnswer: string, problemId = id) => fetch(`${base}/api/problems/${problemId}/submit`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userAnswer }),
    });
    for (const path of ["/api/problems", `/api/problems/${id}`, "/api/problems?topic=HTTP_TEST&language=Java&difficulty=EASY",
      "/problems", `/problems/${id}`, "/problems?topic=HTTP_TEST"]) {
      const text = await (await get(path)).text();
      assert.ok(text.includes(id), path);
      assert.ok(!text.includes(`SECRET-${id}`), "No explanation before submission");
      if (path.startsWith("/api/")) assert.ok(!text.includes('"answer":'));
    }
    const rsc = await fetch(`${base}/problems/${id}`, { headers: { RSC: "1" } });
    assert.equal(rsc.status, 200);
    assert.ok(!(await rsc.text()).includes(`SECRET-${id}`));
    for (const answer of [" 20 ", "wrong one", "wrong two"]) {
      const response = await submit(answer);
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(result.correct, answer.trim() === "20");
      assert.equal(result.score, answer.trim() === "20" ? 5 : 0);
      assert.equal(result.explanation, `SECRET-${id}`);
      assert.ok(db.select().from(problemAttempts).where(eq(problemAttempts.id, result.attemptId)).get());
    }
    assert.equal((await submit(" ")).status, 400);
    assert.equal((await submit("20", `missing-${id}`)).status, 404);
    const history = await (await get(`/api/attempts?problemId=${id}`)).json();
    assert.equal(history.length, 3);
    assert.equal(history[0].userAnswer, "wrong two");
    assert.equal((await (await get(`/api/attempts?problemId=${id}&correct=true`)).json()).length, 1);
    const wrong = (await (await get("/api/wrong-answers?limit=200")).json()).find((row: { problem: { id: string } }) => row.problem.id === id);
    assert.equal(wrong.wrongCount, 2);
    assert.equal(wrong.latestWrongAttempt.userAnswer, "wrong two");
    assert.equal(wrong.problem.subTopic, "temporary");
    assert.equal((await fetch(base + "/api/attempts?limit=0")).status, 400);
    console.log("PASS HTTP: pages/HTML/RSC secrecy, list/detail/filters, submissions, persisted attempts, wrong counts, 400/404.");
  } finally {
    // Only this run's UUID is eligible for cleanup, including its submitted attempts.
    db.transaction(tx => {
      tx.delete(problemAttempts).where(eq(problemAttempts.problemId, id)).run();
      tx.delete(problems).where(eq(problems.id, id)).run();
    });
    assert.equal(db.select().from(problemAttempts).where(eq(problemAttempts.problemId, id)).all().length, 0);
    assert.equal(db.select().from(problems).where(eq(problems.id, id)).all().length, 0);
    db.$client.close();
    console.log(`CLEANUP: ${id} and only its attempts removed.`);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
