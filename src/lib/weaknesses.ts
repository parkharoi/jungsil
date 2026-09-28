import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { problems } from "@/db/schema";
import { reviewQuery, queryLimit } from "@/lib/reviews";
import { InvalidFilterError } from "@/lib/problems";
import { weaknessLevels } from "@/lib/learning-labels";

export const dimensions = ["topic", "subTopic", "language", "questionType", "sourceType"] as const;
type Dimension = typeof dimensions[number];

function grouped(dimension: Dimension, limit: number, staleOnly = false) {
  const { db, ordered, totals, review } = reviewQuery();
  const attempted = sql<number>`sum(${review.totalAttemptCount})`;
  const correct = sql<number>`sum(${review.correctCount})`;
  const repeated = sql<number>`sum(max(${review.wrongCount} - 1, 0))`;
  const accuracy = sql<number>`100.0 * ${correct} / ${attempted}`;
  const rank = sql<number>`case when count(*) < 3 then 4 when ${accuracy} < 60 and ${repeated} >= 2 then 0 when ${accuracy} < 60 then 1 when ${accuracy} < 75 then 2 else 3 end`;
  const rows = db.with(ordered, totals, review).select({
    value: problems[dimension], attemptedCount: attempted, uniqueProblemsSolved: sql<number>`count(*)`,
    correctCount: correct, wrongCount: sql<number>`sum(${review.wrongCount})`,
    accuracy, repeatedWrongCount: repeated, lastAttemptedAt: sql<number>`max(${review.lastAttemptedAt})`, rank,
  }).from(review).innerJoin(problems, eq(problems.id, review.problemId)).groupBy(problems[dimension])
    .having(staleOnly ? sql`count(*) >= 3 and ${accuracy} < 60 and max(${review.lastAttemptedAt}) < ${Math.floor(Date.now() / 1000) - 7 * 86400}` : undefined)
    .orderBy(asc(rank), asc(accuracy), desc(repeated), asc(problems[dimension])).limit(limit).all();
  return rows.map(({ rank, lastAttemptedAt, ...row }) => ({
    ...row, accuracy: Math.round(row.accuracy * 10) / 10,
    lastAttemptedAt: new Date(lastAttemptedAt * 1000).toISOString(), weaknessLevel: weaknessLevels[rank],
  }));
}

export function getWeaknesses(params = new URLSearchParams()) {
  for (const key of params.keys()) {
    if (key !== "limit" || params.getAll(key).length !== 1) throw new InvalidFilterError("지원하지 않거나 중복된 필터입니다.");
  }
  const limit = queryLimit(params);
  const { db, ordered, totals, review, status } = reviewQuery();
  const overall = db.with(ordered, totals, review).select({
    totalAttempts: sql<number>`coalesce(sum(${review.totalAttemptCount}), 0)`,
    totalCorrect: sql<number>`coalesce(sum(${review.correctCount}), 0)`,
    totalWrong: sql<number>`coalesce(sum(${review.wrongCount}), 0)`,
    uniqueProblemsSolved: sql<number>`count(*)`,
    unresolvedWrongProblems: sql<number>`coalesce(sum(case when ${review.wrongCount} > 0 and ${status} != 'MASTERED' then 1 else 0 end), 0)`,
  }).from(review).get()!;
  const topic = grouped("topic", Math.max(limit, 5));
  const language = grouped("language", Math.max(limit, 5));
  const groups = {
    topic: topic.slice(0, limit), subTopic: grouped("subTopic", limit), language: language.slice(0, limit),
    questionType: grouped("questionType", limit), sourceType: grouped("sourceType", limit),
  };
  const recommendations: { title: string; href: string; reason: string }[] = [];
  const add = (title: string, href: string, reason: string) => {
    if (recommendations.length < 5 && !recommendations.some(r => r.href === href)) recommendations.push({ title, href, reason });
  };
  const reviewCandidates = (state: "NOT_REVIEWED" | "REVIEWING") => db.with(ordered, totals, review)
    .select({ id: problems.id, title: problems.title, wrongCount: review.wrongCount })
    .from(review).innerJoin(problems, eq(problems.id, review.problemId))
    .where(and(eq(status, state), gt(review.wrongCount, state === "NOT_REVIEWED" ? 1 : 0), eq(problems.verificationStatus, "VERIFIED")))
    .orderBy(desc(review.wrongCount), desc(review.latestWrongAt), asc(problems.id)).limit(5).all();
  for (const row of reviewCandidates("NOT_REVIEWED")) add(row.title + " 다시 풀기", "/problems/" + encodeURIComponent(row.id) + "?mode=retry", "아직 복습하지 않은 반복 오답 " + row.wrongCount + "회");
  for (const row of topic.filter(r => r.weaknessLevel === "FOCUS")) add(row.value + " 집중 복습", "/wrong-answers?" + new URLSearchParams({ topic: row.value! }), "낮은 정답률과 반복 오답");
  for (const row of language.filter(r => r.weaknessLevel === "WEAK" || r.weaknessLevel === "FOCUS")) add((row.value ?? "언어 없음") + " 오답 복습", "/wrong-answers?" + new URLSearchParams({ language: row.value ?? "NONE" }), "언어별 취약 영역");
  for (const row of reviewCandidates("REVIEWING")) add(row.title + " 한 번 더 풀기", "/problems/" + encodeURIComponent(row.id) + "?mode=retry", "복습 완료까지 재풀이 정답 1회 더 필요");
  if (recommendations.length < 5) {
    for (const row of grouped("topic", 5, true)) add(row.value + " 다시 살펴보기", "/wrong-answers?" + new URLSearchParams({ topic: row.value! }), "최근 7일 동안 풀지 않은 취약 주제");
  }
  return { ...overall, accuracy: overall.totalAttempts ? Math.round(overall.totalCorrect / overall.totalAttempts * 1000) / 10 : 0, groups, recommendations };
}
