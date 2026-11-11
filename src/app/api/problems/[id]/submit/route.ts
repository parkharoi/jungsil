import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { attemptContexts, problemAttempts, problems } from "@/db/schema";
import { verifiedProblem } from "@/lib/problems";
import { gradeParts, isBlankType } from "@/lib/answer-parts";
import { gradeAnswer } from "@/lib/grading";
import { getReviewState } from "@/lib/reviews";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      return Response.json({ error: "올바른 JSON 형식으로 답안을 보내주세요." }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "답안을 입력해 주세요." }, { status: 400 });
    }
    const attemptContext = "attemptContext" in body ? body.attemptContext : "PRACTICE";
    if (typeof attemptContext !== "string" || !attemptContexts.includes(attemptContext as typeof attemptContexts[number])) {
      return Response.json({ error: "유효하지 않은 풀이 유형입니다." }, { status: 400 });
    }
    const submittedAt = new Date(Math.floor(Date.now() / 1000) * 1000);
    let startedAt: Date | null = null;
    if ("startedAt" in body && body.startedAt !== null) {
      if (typeof body.startedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(body.startedAt)) {
        return Response.json({ error: "startedAt은 UTC ISO 날짜여야 합니다." }, { status: 400 });
      }
      const parsed = new Date(body.startedAt);
      if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== body.startedAt || parsed.getTime() > Date.now()) {
        return Response.json({ error: "유효하지 않은 시작 시각입니다." }, { status: 400 });
      }
      startedAt = new Date(Math.floor(parsed.getTime() / 1000) * 1000);
    }
    const { id } = await params;
    const problem = getDb().select({
      answer: problems.answer,
      answerParts: problems.answerParts,
      acceptedAnswers: problems.acceptedAnswers,
      explanation: problems.explanation,
      questionType: problems.questionType,
    }).from(problems).where(and(verifiedProblem, eq(problems.id, id))).get();
    if (!problem) {
      return Response.json({ error: "문제를 찾을 수 없습니다." }, { status: 404 });
    }
    const parts = isBlankType(problem.questionType) ? problem.answerParts : null;
    let userAnswer: string;
    let results: ReturnType<typeof gradeParts> | undefined;
    if (parts?.length) {
      const answers = "userAnswers" in body ? body.userAnswers : null;
      if (!answers || typeof answers !== "object" || Array.isArray(answers) || "userAnswer" in body
        || Object.keys(answers).length !== parts.length
        || !parts.every(part => Object.hasOwn(answers, part.key))
        || !Object.values(answers).every(value => typeof value === "string" && value.trim() && value.length <= 10000)) {
        return Response.json({ error: "정의된 모든 빈칸에 답안을 입력해 주세요. 빈칸당 10,000자까지 가능합니다." }, { status: 400 });
      }
      const submitted = answers as Record<string, string>;
      userAnswer = JSON.stringify(Object.fromEntries(parts.map(part => [part.key, submitted[part.key]])));
      results = gradeParts(parts, submitted);
    } else {
      if (!("userAnswer" in body) || typeof body.userAnswer !== "string" || !body.userAnswer.trim()
        || body.userAnswer.length > 10000 || "userAnswers" in body) {
        return Response.json({ error: "답안은 비어 있지 않은 10,000자 이하 문자열이어야 합니다." }, { status: 400 });
      }
      userAnswer = body.userAnswer;
    }
    const correct = results ? results.every(result => result.correct) : gradeAnswer(problem, userAnswer);
    const score = correct ? 5 : 0;
    const { attempt, review } = getDb().transaction(tx => {
      const attempt = tx.insert(problemAttempts).values({
        problemId: id, userAnswer, correct, score, startedAt, submittedAt,
        durationSeconds: startedAt ? (submittedAt.getTime() - startedAt.getTime()) / 1000 : null,
        attemptContext: attemptContext as typeof attemptContexts[number],
      }).returning({ id: problemAttempts.id }).get();
      const review = attemptContext === "WRONG_ANSWER_RETRY" ? getReviewState(id) : null;
      return { attempt, review };
    });
    return Response.json({
      attemptId: attempt.id, correct, score, ...(review ?? {}),
      userAnswer,
      ...(results ? { results, correctParts: results.filter(result => result.correct).length, totalParts: results.length } : {}),
      correctAnswer: problem.answer,
      explanation: problem.explanation,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Failed to grade problem.");
    return Response.json({ error: "답안을 채점하지 못했습니다." }, { status: 500 });
  }
}
