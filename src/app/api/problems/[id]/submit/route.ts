import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { problems } from "@/db/schema";
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
    return Response.json({
      correct: gradeAnswer(problem, body.userAnswer),
      userAnswer: body.userAnswer,
      correctAnswer: problem.answer,
      explanation: problem.explanation,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Failed to grade problem.");
    return Response.json({ error: "답안을 채점하지 못했습니다." }, { status: 500 });
  }
}
