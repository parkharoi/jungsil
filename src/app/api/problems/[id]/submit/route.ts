import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { attemptContexts, problemAttempts, problems } from "@/db/schema";
import { verifiedProblem } from "@/lib/problems";
import { gradeAnswer } from "@/lib/grading";

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
    if (!body || typeof body !== "object" || !("userAnswer" in body)
      || typeof body.userAnswer !== "string" || !body.userAnswer.trim()) {
      return Response.json({ error: "답안을 입력해 주세요." }, { status: 400 });
    }
    if (body.userAnswer.length > 10000) {
      return Response.json({ error: "답안은 10,000자 이내로 입력해 주세요." }, { status: 400 });
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
      acceptedAnswers: problems.acceptedAnswers,
      explanation: problems.explanation,
      questionType: problems.questionType,
    }).from(problems).where(and(verifiedProblem, eq(problems.id, id))).get();
    if (!problem) {
      return Response.json({ error: "문제를 찾을 수 없습니다." }, { status: 404 });
    }
    const correct = gradeAnswer(problem, body.userAnswer);
    const score = correct ? 5 : 0;
    const attempt = getDb().insert(problemAttempts).values({
      problemId: id, userAnswer: body.userAnswer, correct, score, startedAt, submittedAt,
      durationSeconds: startedAt ? (submittedAt.getTime() - startedAt.getTime()) / 1000 : null,
      attemptContext: attemptContext as typeof attemptContexts[number],
    }).returning({ id: problemAttempts.id }).get();
    return Response.json({
      attemptId: attempt.id, correct, score,
      userAnswer: body.userAnswer,
      correctAnswer: problem.answer,
      explanation: problem.explanation,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Failed to grade problem.");
    return Response.json({ error: "답안을 채점하지 못했습니다." }, { status: 500 });
  }
}
