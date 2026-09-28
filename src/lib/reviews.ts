import { and, asc, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { examSets, problemAttempts, problems, questionTypes, sourceTypes } from "@/db/schema";
import { InvalidFilterError } from "@/lib/problems";
import { reviewLabels, type ReviewStatus } from "@/lib/learning-labels";

// Same-second submissions use SQLite rowid, matching the existing attempts API.
export function reviewQuery(problemId?: string) {
  const db = getDb();
  const ordered = db.$with("ordered_attempts").as(db.select({
    problemId: problemAttempts.problemId, attemptId: problemAttempts.id,
    correct: problemAttempts.correct, context: problemAttempts.attemptContext,
    userAnswer: problemAttempts.userAnswer, submittedAt: problemAttempts.submittedAt,
    position: sql<number>`row_number() over (partition by ${problemAttempts.problemId} order by ${problemAttempts.submittedAt}, problem_attempts.rowid)`.as("position"),
  }).from(problemAttempts).where(problemId === undefined ? undefined : eq(problemAttempts.problemId, problemId)));
  const totals = db.$with("attempt_totals").as(db.select({
    problemId: ordered.problemId,
    totalAttemptCount: sql<number>`count(*)`.as("total_attempt_count"),
    correctCount: sql<number>`sum(${ordered.correct})`.as("correct_count"),
    wrongCount: sql<number>`sum(case when ${ordered.correct} = 0 then 1 else 0 end)`.as("wrong_count"),
    lastWrongPosition: sql<number>`coalesce(max(case when ${ordered.correct} = 0 then ${ordered.position} end), 0)`.as("last_wrong_position"),
    lastPosition: sql<number>`max(${ordered.position})`.as("last_position"),
    lastAttemptedAt: sql<number>`max(${ordered.submittedAt})`.as("last_attempted_at"),
  }).from(ordered).groupBy(ordered.problemId));
  const review = db.$with("problem_reviews").as(db.select({
    problemId: totals.problemId, totalAttemptCount: totals.totalAttemptCount,
    correctCount: totals.correctCount, wrongCount: totals.wrongCount, lastAttemptedAt: totals.lastAttemptedAt,
    latestAttemptCorrect: sql<boolean>`max(case when ${ordered.position} = ${totals.lastPosition} then ${ordered.correct} end)`.mapWith(Boolean).as("latest_attempt_correct"),
    latestWrongAnswer: sql<string | null>`max(case when ${ordered.position} = ${totals.lastWrongPosition} then ${ordered.userAnswer} end)`.as("latest_wrong_answer"),
    latestWrongId: sql<string | null>`max(case when ${ordered.position} = ${totals.lastWrongPosition} then ${ordered.attemptId} end)`.as("latest_wrong_id"),
    latestWrongAt: sql<number | null>`max(case when ${ordered.position} = ${totals.lastWrongPosition} then ${ordered.submittedAt} end)`.as("latest_wrong_at"),
    consecutiveCorrectCount: sql<number>`sum(case when ${ordered.position} > ${totals.lastWrongPosition} and ${ordered.correct} = 1 and ${ordered.context} = 'WRONG_ANSWER_RETRY' then 1 else 0 end)`.as("consecutive_correct_count"),
  }).from(ordered).innerJoin(totals, eq(ordered.problemId, totals.problemId)).groupBy(totals.problemId));
  const status = sql<ReviewStatus>`case when ${review.consecutiveCorrectCount} >= 2 then 'MASTERED' when ${review.consecutiveCorrectCount} = 1 then 'REVIEWING' else 'NOT_REVIEWED' end`;
  return { db, ordered, totals, review, status };
}

export function getReviewState(problemId: string) {
  const { db, ordered, totals, review, status } = reviewQuery(problemId);
  return db.with(ordered, totals, review).select({
    consecutiveCorrectCount: review.consecutiveCorrectCount, reviewStatus: status,
  }).from(review).where(gt(review.wrongCount, 0)).get() ?? null;
}

export function queryLimit(params: URLSearchParams) {
  const value = params.get("limit") ?? "50";
  if (!/^[1-9]\d*$/.test(value) || Number(value) > 200) throw new InvalidFilterError("limit은 1~200의 정수여야 합니다.");
  return Number(value);
}

const year = sql<number | null>`coalesce(${examSets.examYear}, ${problems.sourceYear})`;
const round = sql<number | null>`coalesce(${examSets.examRound}, ${problems.sourceRound})`;
export const wrongFilterKeys = ["sourceType", "examYear", "examRound", "questionType", "topic", "subTopic", "language", "reviewStatus"] as const;

export function listWrongAnswers(params: URLSearchParams) {
  const { db, ordered, totals, review, status } = reviewQuery();
  for (const key of params.keys()) {
    if (![...wrongFilterKeys, "limit", "offset"].includes(key) || params.getAll(key).length !== 1) {
      throw new InvalidFilterError("지원하지 않거나 중복된 필터입니다.");
    }
  }
  const limit = queryLimit(params);
  const offset = params.get("offset") ?? "0";
  if (!/^(0|[1-9]\d*)$/.test(offset) || !Number.isSafeInteger(Number(offset))) throw new InvalidFilterError("offset은 0 이상의 정수여야 합니다.");
  const conditions = [gt(review.wrongCount, 0)];
  for (const key of wrongFilterKeys) {
    const value = params.get(key);
    if (!value) continue;
    if (value.length > 200 || !value.trim()) throw new InvalidFilterError("필터 값이 올바르지 않습니다.");
    if (key === "examYear" || key === "examRound") {
      if (!/^[1-9]\d*$/.test(value) || Number(value) > 9999 || (key === "examYear" && Number(value) < 1900)) throw new InvalidFilterError("연도·회차가 올바르지 않습니다.");
      conditions.push(eq(key === "examYear" ? year : round, Number(value)));
    } else if (key === "reviewStatus") {
      if (!Object.hasOwn(reviewLabels, value)) throw new InvalidFilterError("복습 상태가 올바르지 않습니다.");
      conditions.push(eq(status, value as ReviewStatus));
    } else {
      if (key === "sourceType" && !sourceTypes.includes(value as typeof sourceTypes[number])) throw new InvalidFilterError("출처가 올바르지 않습니다.");
      if (key === "questionType" && !questionTypes.includes(value as typeof questionTypes[number])) throw new InvalidFilterError("문제 유형이 올바르지 않습니다.");
      conditions.push((key === "language" || key === "subTopic") && value === "NONE" ? isNull(problems[key]) : eq(problems[key], value));
    }
  }
  const rows = db.with(ordered, totals, review).select({
    problemId: problems.id, title: problems.title, content: problems.content, questionType: problems.questionType,
    topic: problems.topic, subTopic: problems.subTopic, language: problems.language, difficulty: problems.difficulty,
    sourceType: problems.sourceType, examYear: year, examRound: round, questionNumber: problems.questionNumber,
    wrongCount: review.wrongCount, totalAttemptCount: review.totalAttemptCount,
    latestWrongAnswer: review.latestWrongAnswer, correctAnswer: problems.answer, explanation: problems.explanation,
    latestWrongAt: review.latestWrongAt, latestAttemptCorrect: review.latestAttemptCorrect,
    consecutiveCorrectCount: review.consecutiveCorrectCount, reviewStatus: status, latestWrongId: review.latestWrongId,
  }).from(review).innerJoin(problems, eq(problems.id, review.problemId)).leftJoin(examSets, eq(examSets.id, problems.examSetId))
    .where(and(...conditions)).orderBy(
      asc(sql`case when ${status} = 'NOT_REVIEWED' then 0 when ${status} = 'REVIEWING' then 1 else 2 end`),
      desc(review.wrongCount), desc(review.latestWrongAt), asc(problems.id),
    ).limit(limit).offset(Number(offset)).all();
  return rows.map(({ latestWrongId, ...row }) => ({
    ...row, latestWrongAt: new Date(row.latestWrongAt! * 1000).toISOString(),
    // Keep the earlier API's nested metadata for existing consumers.
    problem: { id: row.problemId, title: row.title, topic: row.topic, subTopic: row.subTopic, language: row.language, questionType: row.questionType, difficulty: row.difficulty },
    latestWrongAttempt: { attemptId: latestWrongId, userAnswer: row.latestWrongAnswer, submittedAt: new Date(row.latestWrongAt! * 1000).toISOString() },
  }));
}

export function getWrongSummary() {
  const { db, ordered, totals, review, status } = reviewQuery();
  const summary = db.with(ordered, totals, review).select({
    total: sql<number>`count(*)`,
    notReviewed: sql<number>`coalesce(sum(case when ${status} = 'NOT_REVIEWED' then 1 else 0 end), 0)`,
    reviewing: sql<number>`coalesce(sum(case when ${status} = 'REVIEWING' then 1 else 0 end), 0)`,
    mastered: sql<number>`coalesce(sum(case when ${status} = 'MASTERED' then 1 else 0 end), 0)`,
  }).from(review).where(gt(review.wrongCount, 0)).get()!;
  const weakest = db.with(ordered, totals, review).select({ topic: problems.topic })
    .from(review).innerJoin(problems, eq(problems.id, review.problemId)).where(gt(review.wrongCount, 0))
    .groupBy(problems.topic).orderBy(desc(sql`sum(${review.wrongCount})`), asc(problems.topic)).limit(1).get();
  return { ...summary, mostWrongTopic: weakest?.topic ?? null };
}
