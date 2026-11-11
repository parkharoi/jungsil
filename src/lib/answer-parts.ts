import type { AnswerPart, Problem } from "@/db/schema";

export const isBlankType = (type: Problem["questionType"]) => type === "SQL_BLANK" || type === "CODE_BLANK";

export function gradeParts(parts: AnswerPart[], answers: Record<string, string>) {
  const normalize = (value: string) => value.trim().toLowerCase();
  return parts.map(part => {
    const userAnswer = Object.hasOwn(answers, part.key) ? answers[part.key] : "";
    return {
      key: part.key, label: part.label ?? part.key, userAnswer, correctAnswer: part.answer,
      correct: !!userAnswer.trim() && [part.answer, ...(part.acceptedAnswers ?? [])]
        .some(answer => normalize(answer) === normalize(userAnswer)),
    };
  });
}

export function parseStoredAnswers(value: string | null): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(value ?? "");
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)
      && Object.values(parsed).every(v => typeof v === "string")) return parsed as Record<string, string>;
  } catch { /* Older single-answer attempts remain readable. */ }
  return {};
}
