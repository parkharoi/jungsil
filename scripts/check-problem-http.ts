import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { eq } from "drizzle-orm";
import { getDb } from "../src/db";
import { examSets, problemAttempts, problems } from "../src/db/schema";

async function main() {
  const root = process.cwd(), temporary = mkdtempSync(join(tmpdir(), "jungsil-http-"));
  process.chdir(temporary);
  const db = getDb();
  const serverFile = join(temporary, "server.cjs");
  writeFileSync(serverFile, `
    const next = require(${JSON.stringify(join(root, "node_modules/next"))});
    const driverPath = require.resolve(${JSON.stringify(join(root, "node_modules/better-sqlite3"))});
    const Driver = require(driverPath);
    require.cache[driverPath].exports = new Proxy(Driver, {construct(target, args) {
      if (require('node:path').resolve(args[0]) !== ${JSON.stringify(join(root, "data/jungsil.db"))}) throw new Error("Unexpected database path blocked: " + args[0]);
      return Reflect.construct(target, [${JSON.stringify(join(temporary, "data/jungsil.db"))}, ...args.slice(1)]);
    }});
    const app = next({dev:false,dir:${JSON.stringify(root)},hostname:'127.0.0.1',port:0});
    app.prepare().then(() => {

      const server = require('node:http').createServer(app.getRequestHandler());
      server.listen(0, '127.0.0.1', () => process.send({port:server.address().port}));
    }).catch(e => {console.error(e);process.exit(1)});
  `);
  const server = spawn(process.execPath, [serverFile], { cwd: root, stdio: ["ignore", "pipe", "pipe", "ipc"] });
  let output = "";
  server.stdout!.on("data", data => { output += data; });
  server.stderr!.on("data", data => { output += data; });
  const id = `test-http-${crypto.randomUUID()}`;
  try {
    migrate(db, { migrationsFolder: join(root, "drizzle") });
    const port = await new Promise<number>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Temporary server timeout: " + output)), 30000);
      server.once("message", message => { clearTimeout(timer); resolve((message as { port: number }).port); });
      server.once("error", error => { clearTimeout(timer); reject(error); });
      server.once("exit", code => { clearTimeout(timer); reject(new Error("Temporary server exited " + code + ": " + output)); });
    });
    const base = "http://127.0.0.1:" + port;
    const exam = db.insert(examSets).values({ certification: "TEST", examYear: 2026, examRound: 2, examDate: "2026-07-19", title: "HTTP_EXAM", questionCount: 2, sourceType: "MANUAL" }).returning().get();
    db.insert(problems).values({
      examSetId: exam.id, questionNumber: 1,
      id, title: id, content: "HTTP integration fixture", answer: "20",
      explanation: `SECRET-${id}`, questionType: "CODE_OUTPUT", topic: "HTTP_TEST",
      subTopic: "temporary", language: "Java", difficulty: "EASY", sourceType: "MANUAL",
      sourceName: "AUTOMATED_TEST_ONLY", verificationStatus: "VERIFIED",
    }).run();
    const get = async (path: string) => {
      const response = await fetch(base + path);
      assert.equal(response.status, 200, path + "\n" + output);
      return response;
    };
    const nextId = id + "-next";
    db.insert(problems).values({ id: nextId, examSetId: exam.id, questionNumber: 2, title: "Next question", content: "HTTP fixture 2", answer: "20", explanation: "NEXT_SECRET", questionType: "SHORT_ANSWER", topic: "HTTP_TEST", difficulty: "EASY", sourceType: "MANUAL", sourceName: "TEST", verificationStatus: "VERIFIED" }).run();
    for (const path of ["/", "/problems", `/exams/${exam.id}`]) {
      const html = await (await get(path)).text();
      assert.ok(html.replace(/<!--[\s\S]*?-->/g, "").includes("2026년 2회"), path);
      assert.ok(!html.includes("NEXT_SECRET"));
    }
    const home = await (await get("/")).text();
    assert.ok(home.includes("2026. 10. 25") && home.includes("scholar"));
    const examPage = await (await get(`/problems/${id}?exam=${exam.id}`)).text();
    assert.ok(examPage.includes("다음 문제"));
    assert.ok(examPage.includes(`/problems/${nextId}?exam=`));
    assert.ok(!examPage.includes(`SECRET-${id}`));
    const lastPage = await (await get(`/problems/${nextId}?exam=${exam.id}`)).text();
    assert.ok(lastPage.includes("회차 풀이 확인"));
    assert.equal((await fetch(base + "/exams/missing")).status, 404);
    const submit = (userAnswer: string, problemId = id, attemptContext = "PRACTICE") => fetch(`${base}/api/problems/${problemId}/submit`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userAnswer, attemptContext }),
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
    const notebook = await (await get("/wrong-answers?topic=HTTP_TEST")).text();
    assert.ok(notebook.includes(id));
    assert.ok(notebook.includes("?mode=retry"));
    const retryPage = await (await get(`/problems/${id}?mode=retry`)).text();
    assert.ok(!retryPage.includes(`SECRET-${id}`));
    const retryRsc = await fetch(`${base}/problems/${id}?mode=retry`, { headers: { RSC: "1" } });
    assert.equal(retryRsc.status, 200);
    assert.ok(!(await retryRsc.text()).includes(`SECRET-${id}`));
    const firstRetry = await (await submit("20", id, "WRONG_ANSWER_RETRY")).json();
    assert.equal(firstRetry.reviewStatus, "REVIEWING");
    assert.equal(firstRetry.consecutiveCorrectCount, 1);
    const secondRetry = await (await submit("20", id, "WRONG_ANSWER_RETRY")).json();
    assert.equal(secondRetry.reviewStatus, "MASTERED");
    await submit("wrong again", id, "WRONG_ANSWER_RETRY");
    const updated = (await (await get("/api/wrong-answers?topic=HTTP_TEST")).json()).find((row: { problemId: string }) => row.problemId === id);
    assert.equal(updated.reviewStatus, "NOT_REVIEWED");
    assert.equal(updated.wrongCount, 3);
    const stats = await (await get("/api/stats/weaknesses")).json();
    assert.equal(stats.groups.topic.find((row: { value: string }) => row.value === "HTTP_TEST").weaknessLevel, "INSUFFICIENT_DATA");
    await get("/stats");
    const blankId = id + "-blank";
    db.insert(problems).values({
      id: blankId, title: blankId, content: "( ① ) ( ② )", code: "SELECT ( ① ) ORDER BY ( ② )",
      answer: "SECRET-LEGACY-" + id, answerParts: [
        { key: "①", label: "첫 빈칸", answer: "SECRET-ONE-" + id, acceptedAnswers: ["ALTERNATIVE-" + id] },
        { key: "②", answer: "SECRET-TWO-" + id },
      ],
      explanation: "SECRET-EXPLANATION-" + id, questionType: "SQL_BLANK", topic: "BLANK_HTTP",
      difficulty: "EASY", sourceType: "MANUAL", sourceName: "TEST_ONLY", verificationStatus: "VERIFIED",
    }).run();
    for (const path of ["/api/problems", "/api/problems/" + blankId, "/problems/" + blankId, "/problems/" + blankId + "?mode=retry"]) {
      const response = await get(path);
      const text = await response.text();
      for (const prefix of ["SECRET-LEGACY-", "SECRET-ONE-", "SECRET-TWO-", "SECRET-EXPLANATION-", "ALTERNATIVE-"]) assert.ok(!text.includes(prefix + id), path);
      if (path.startsWith("/problems/")) {
        assert.match(text, /answer-part-0/); assert.match(text, /answer-part-1/);
        const rsc = await fetch(base + path, { headers: { RSC: "1" } });
        assert.equal(rsc.status, 200);
        const stream = await rsc.text();
        for (const prefix of ["SECRET-", "ALTERNATIVE-"]) assert.ok(!stream.includes(prefix), "RSC secrecy");
      }
    }
    const blankSubmit = (second: string, context = "PRACTICE") => fetch(base + "/api/problems/" + blankId + "/submit", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAnswers: { "①": "ALTERNATIVE-" + id, "②": second }, attemptContext: context }),
    });
    const blankResponse = await blankSubmit("WRONG-" + id);
    assert.equal(blankResponse.status, 200);
    const blankResult = await blankResponse.json();
    assert.equal(blankResult.correctParts, 1); assert.equal(blankResult.totalParts, 2);
    const notebookHtml = await (await get("/wrong-answers?topic=BLANK_HTTP")).text();
    for (const value of ["WRONG-" + id, "SECRET-ONE-" + id, "SECRET-TWO-" + id, "?mode=retry"]) assert.ok(notebookHtml.includes(value));
    const blankReview = await (await blankSubmit("SECRET-TWO-" + id, "WRONG_ANSWER_RETRY")).json();
    assert.equal(blankReview.reviewStatus, "REVIEWING");
    console.log("PASS HTTP: isolated DB, blank inputs, HTML/RSC/API secrecy, blank grading, notebook answers and retry.");
    console.log("PASS HTTP: notebook cards, retry navigation/HTML/RSC secrecy, review states, weakness API/page.");
    console.log("PASS HTTP: pages/HTML/RSC secrecy, list/detail/filters, submissions, persisted attempts, wrong counts, 400/404.");
  } finally {
    if (server.exitCode === null && server.signalCode === null) {
      const stopped = once(server, "exit"); server.kill(); await stopped;
    }
    db.$client.close();
    process.chdir(root);
    assert.ok(resolve(temporary).startsWith(resolve(tmpdir()) + sep));
    rmSync(temporary, { recursive: true, force: true });
    console.log("CLEANUP: temporary HTTP server and database removed; learning DB untouched.");
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
