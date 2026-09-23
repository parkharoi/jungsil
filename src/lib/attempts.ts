import { and, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { problemAttempts, problems } from "@/db/schema";
import { InvalidFilterError } from "@/lib/problems";

const problemInfo = {
  id: problems.id, title: problems.title, topic: problems.topic, subTopic: problems.subTopic,
  language: problems.language, questionType: problems.questionType, difficulty: problems.difficulty,
};

function filters(params: URLSearchParams, wrongOnly: boolean) {
  const allowed = wrongOnly ? ["limit"] : ["limit", "correct", "problemId"];
  for (const key of params.keys()) {
    if (!allowed.includes(key) || params.getAll(key).length !== 1) {
      throw new InvalidFilterError("지원하지 않거나 중복된 필터입니다.");
    }
  }
  const limit = params.get("limit") ?? "50";
  if (!/^[1-9]\d*$/.test(limit) || Number(limit) > 200) {
    throw new InvalidFilterError("limit은 1~200의 정수여야 합니다.");
  }
  const correct = params.get("correct");
  if (correct !== null && correct !== "true" && correct !== "false") {
    throw new InvalidFilterError("correct는 true 또는 false여야 합니다.");
  }
  const problemId = params.get("problemId");
  if (problemId !== null && (!problemId.trim() || problemId.length > 200)) {
    throw new InvalidFilterError("유효하지 않은 문제 ID입니다.");
  }
  return { limit: Number(limit), correct: correct === null ? undefined : correct === "true", problemId };
}

export function listAttempts(params: URLSearchParams) {
  const { limit, correct, problemId } = filters(params, false);
  return getDb().select({ ...getTableColumns(problemAttempts), problem: problemInfo })
    .from(problemAttempts).innerJoin(problems, eq(problems.id, problemAttempts.problemId))
    .where(and(
      correct === undefined ? undefined : eq(problemAttempts.correct, correct),
      problemId === null ? undefined : eq(problemAttempts.problemId, problemId),
    ))
    .orderBy(desc(problemAttempts.submittedAt), sql`problem_attempts.rowid desc`).limit(limit).all();
}

export function listWrongAnswers(params: URLSearchParams) {
  const { limit } = filters(params, true);
  const db = getDb();
  const ranked = db.select({
    problemId: problemAttempts.problemId, attemptId: problemAttempts.id,
    userAnswer: problemAttempts.userAnswer, submittedAt: problemAttempts.submittedAt,
    wrongCount: sql<number>`count(*) over (partition by ${problemAttempts.problemId})`.as("wrong_count"),
    rank: sql<number>`row_number() over (partition by ${problemAttempts.problemId} order by ${problemAttempts.submittedAt} desc, problem_attempts.rowid desc)`.as("rank"),
    sequence: sql<number>`problem_attempts.rowid`.as("sequence"),
  }).from(problemAttempts).where(eq(problemAttempts.correct, false)).as("ranked");
  return db.select({
    problem: problemInfo, wrongCount: ranked.wrongCount,
    latestWrongAttempt: { attemptId: ranked.attemptId, userAnswer: ranked.userAnswer, submittedAt: ranked.submittedAt },
  }).from(ranked).innerJoin(problems, eq(problems.id, ranked.problemId))
    .where(eq(ranked.rank, 1)).orderBy(desc(ranked.submittedAt), desc(ranked.sequence)).limit(limit).all();
}
