import { and, asc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "@/db";
import { difficulties, problems, questionTypes, type Problem } from "@/db/schema";

export const questionTypeLabels: Record<Problem["questionType"], string> = {
  CODE_OUTPUT: "코드 출력", SQL_OUTPUT: "SQL 결과", NORMALIZATION: "정규화",
  NETWORK_CALCULATION: "네트워크 계산", SHORT_ANSWER: "단답형",
};
export const difficultyLabels: Record<Problem["difficulty"], string> = {
  EASY: "쉬움", MEDIUM: "보통", HARD: "어려움",
};

// Public reads never select grading data, including data serialized into pages.
export const verifiedProblem = eq(problems.verificationStatus, "VERIFIED");

const publicColumns = {
  code: problems.code, id: problems.id, title: problems.title, content: problems.content,
  questionType: problems.questionType, topic: problems.topic,
  difficulty: problems.difficulty, language: problems.language,
  sourceType: problems.sourceType, sourceName: problems.sourceName,
  sourceUrl: problems.sourceUrl, sourceYear: problems.sourceYear,
  sourceRound: problems.sourceRound, createdAt: problems.createdAt,
  updatedAt: problems.updatedAt,
};

export class InvalidFilterError extends Error {}

export function getFilterOptions() {
  const db = getDb();
  return {
    questionType: [...questionTypes],
    topic: db.selectDistinct({ value: problems.topic }).from(problems)
      .where(verifiedProblem).orderBy(asc(problems.topic)).all().map((row) => row.value),
    difficulty: [...difficulties],
    language: db.selectDistinct({ value: problems.language }).from(problems)
      .where(and(verifiedProblem, isNotNull(problems.language))).orderBy(asc(problems.language))
      .all().map((row) => row.value!),
  };
}

export function listProblems(params: URLSearchParams) {
  const options = getFilterOptions();
  const conditions = [verifiedProblem];
  for (const [key, value] of params) {
    if (!Object.hasOwn(options, key) || params.getAll(key).length !== 1) {
      throw new InvalidFilterError("지원하지 않거나 중복된 필터입니다.");
    }
    // Empty values are the native GET form's 'all' option.
    if (value === "") continue;
    const field = key as keyof typeof options;
    if (!(options[field] as readonly string[]).includes(value)) {
      throw new InvalidFilterError("유효하지 않은 필터 값입니다.");
    }
    conditions.push(eq(problems[field], value));
  }
  return getDb().select(publicColumns).from(problems).where(and(...conditions))
    .orderBy(asc(problems.createdAt), asc(problems.id)).all();
}

export function findProblem(id: string) {
  return getDb().select(publicColumns).from(problems).where(and(verifiedProblem, eq(problems.id, id))).get();
}
