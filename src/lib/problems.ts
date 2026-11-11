import { and, asc, eq, isNotNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { difficulties, examSets, problems, questionTypes, type Problem } from "@/db/schema";

export const questionTypeLabels: Record<Problem["questionType"], string> = {
  CODE_OUTPUT: "코드 출력", SQL_OUTPUT: "SQL 결과", NORMALIZATION: "정규화",
  NETWORK_CALCULATION: "네트워크 계산", SHORT_ANSWER: "단답형", SQL_BLANK: "SQL 빈칸", CODE_BLANK: "코드 빈칸",
};
export const difficultyLabels: Record<Problem["difficulty"], string> = {
  EASY: "쉬움", MEDIUM: "보통", HARD: "어려움",
};

// Public reads never select grading data, including data serialized into pages.
export const verifiedProblem = eq(problems.verificationStatus, "VERIFIED");
export const problemDisplayTitle = sql<string>`${problems.title}`.mapWith((title: string) => title.replace(/^(\d{4}년 \d+회) · PDF (\d+번)/, "$1 $2"));

const publicColumns = {
  answerParts: sql<{ key: string; label?: string }[] | null>`case when ${problems.questionType} in ('SQL_BLANK', 'CODE_BLANK') and ${problems.answerParts} is not null then
    (select json_group_array(json_object('key', json_extract(value, '$.key'), 'label', coalesce(json_extract(value, '$.label'), json_extract(value, '$.key')))) from json_each(${problems.answerParts})) else null end`.mapWith((value) => value === null ? null : JSON.parse(value)),
  examSetId: problems.examSetId, questionNumber: problems.questionNumber,
  code: problems.code, id: problems.id, title: problemDisplayTitle, content: problems.content,
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

export function listExams() {
  return getDb().select({
    id: examSets.id, year: examSets.examYear, round: examSets.examRound,
    certification: examSets.certification, expected: examSets.questionCount,
    available: sql<number>`(select count(*) from problems p where p.exam_set_id = "exam_sets"."id" and p.verification_status = 'VERIFIED')`,
    solved: sql<number>`(select count(*) from problems p where p.exam_set_id = "exam_sets"."id" and p.verification_status = 'VERIFIED' and exists (select 1 from problem_attempts a where a.problem_id = p.id))`,
  }).from(examSets).orderBy(sql`${examSets.examYear} desc`, asc(examSets.examRound)).all();
}

export function listExamProblems(examId: string) {
  return getDb().select({ ...publicColumns,
    solved: sql<boolean>`exists (select 1 from problem_attempts a where a.problem_id = "problems"."id")`.mapWith(Boolean),
  }).from(problems).where(and(verifiedProblem, eq(problems.examSetId, examId)))
    .orderBy(asc(problems.questionNumber)).all();
}
