import type { Problem } from "@/db/schema";

type GradingProblem = Pick<Problem, "answer" | "questionType"> & Partial<Pick<Problem, "acceptedAnswers">>;

export function normalizeAnswer(value: string, questionType: Problem["questionType"]) {
  const normalized = value.replace(/\r\n?/g, "\n").trim().toLowerCase().replace(/ +/g, " ");
  if (questionType === "CODE_OUTPUT") {
    return normalized.split("\n").map((line) => line.trimEnd()).join("\n");
  }
  if (questionType === "SQL_OUTPUT") {
    // Compare values in their original order; ignore result-table spacing.
    return normalized.replace(/\s+/g, " ").replace(/\s*\|\s*/g, "|");
  }
  return normalized;
}

export function gradeAnswer(problem: GradingProblem, userAnswer: string) {
  if (!userAnswer.trim()) return false;
  const submitted = normalizeAnswer(userAnswer, problem.questionType);
  return [problem.answer, ...(problem.acceptedAnswers ?? [])].some(
    (answer) => normalizeAnswer(answer, problem.questionType) === submitted,
  );
}
