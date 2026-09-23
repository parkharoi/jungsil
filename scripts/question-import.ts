import { createHash } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { difficulties, examSets, importSourceTypes, languages, problems, questionTypes, verificationStatuses } from "../src/db/schema";

type Exam = Omit<typeof examSets.$inferInsert, "id" | "createdAt" | "updatedAt">;
type Question = Omit<typeof problems.$inferInsert, "id" | "examSetId" | "createdAt" | "updatedAt">;
type Bundle = { exam: Exam; problems: Question[] };
type RecordValue = Record<string, unknown>;

export class ValidationError extends Error {
  constructor(public readonly errors: string[]) { super(errors.join("\n")); }
}

export function contentHash(content: string, code: string | null = null) {
  return createHash("sha256").update(JSON.stringify([content, code ?? ""].map((v) => v.replace(/\r\n?/g, "\n").trim()))).digest("hex");
}

export function validateBundle(input: unknown): Bundle {
  const errors: string[] = [];
  const error = (path: string, message: string) => { errors.push(`${path}: ${message}`); };
  function object(value: unknown, path: string): RecordValue {
    if (!value || typeof value !== "object" || Array.isArray(value)) { error(path, "객체가 필요합니다."); return {}; }
    return value as RecordValue;
  }
  function keys(value: RecordValue, allowed: string, path: string) {
    for (const key of Object.keys(value)) if (!allowed.split(" ").includes(key)) error(`${path}.${key}`, "지원하지 않는 필드입니다.");
  }
  function str(value: unknown, path: string, required = true): string {
    if (!required && (value === undefined || value === null)) return "";
    if (typeof value !== "string" || (required && !value.trim())) { error(path, "비어 있지 않은 문자열이 필요합니다."); return ""; }
    if (value.length > 100000) error(path, "100,000자를 초과합니다.");
    return value;
  }
  function enumeration<T extends string>(value: unknown, options: readonly T[], path: string): T {
    if (!options.includes(value as T)) error(path, `허용 값: ${options.join(", ")}`);
    return value as T;
  }
  function number(value: unknown, path: string, min: number, max: number): number {
    if (!Number.isSafeInteger(value) || (value as number) < min || (value as number) > max) error(path, `${min}~${max} 정수가 필요합니다.`);
    return value as number;
  }
  function url(value: unknown, path: string): string | null {
    if (value === undefined || value === null) return null;
    const text = str(value, path);
    try {
      const parsed = new URL(text);
      if (!["https:", "http:"].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error();
    } catch { error(path, "인증 정보 없는 HTTP(S) URL이 필요합니다."); }
    return text;
  }
  const root = object(input, "$"), rawExam = object(root.exam, "exam");
  keys(root, "exam problems", "$");
  keys(rawExam, "certification examYear examRound examDate title questionCount sourceType verificationStatus", "exam");
  const date = str(rawExam.examDate, "exam.examDate");
  const parsedDate = new Date(date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) error("exam.examDate", "유효한 YYYY-MM-DD 날짜가 필요합니다.");
  const exam: Exam = {
    certification: str(rawExam.certification, "exam.certification").trim(),
    examYear: number(rawExam.examYear, "exam.examYear", 1900, 9999),
    examRound: number(rawExam.examRound, "exam.examRound", 1, 100),
    examDate: date,
    title: str(rawExam.title, "exam.title"),
    questionCount: number(rawExam.questionCount, "exam.questionCount", 1, 1000),
    sourceType: enumeration(rawExam.sourceType, importSourceTypes, "exam.sourceType"),
    verificationStatus: enumeration(rawExam.verificationStatus === undefined ? "REVIEW_REQUIRED" : rawExam.verificationStatus, verificationStatuses, "exam.verificationStatus"),
  };
  if (date.slice(0, 4) !== String(exam.examYear)) error("exam.examDate", "examYear와 연도가 다릅니다.");
  const rawProblems = Array.isArray(root.problems) ? root.problems : [];
  if (!Array.isArray(root.problems)) error("problems", "배열이 필요합니다.");
  if (rawProblems.length !== exam.questionCount) error("exam.questionCount", "실제 문제 수와 일치해야 합니다.");
  const numbers = new Set<number>(), hashes = new Set<string>();
  const questions = rawProblems.map((value, index): Question => {
    const path = `problems[${index}]`, q = object(value, path);
    keys(q, "title questionNumber questionType topic subTopic difficulty language content code answer acceptedAnswers explanation memoryTip examTip sourceType sourceName sourceUrl secondarySourceUrl verificationStatus verificationNote contentHash redistributionAllowed", path);
    const n = number(q.questionNumber, `${path}.questionNumber`, 1, exam.questionCount);
    if (numbers.has(n)) error(`${path}.questionNumber`, "회차 내 문제 번호가 중복됩니다.");
    numbers.add(n);
    const status = enumeration(q.verificationStatus === undefined ? "REVIEW_REQUIRED" : q.verificationStatus, verificationStatuses, `${path}.verificationStatus`);
    const content = str(q.content, `${path}.content`), code = str(q.code, `${path}.code`, false) || null;
    const hash = contentHash(content, code);
    if (q.contentHash !== undefined && q.contentHash !== hash) error(`${path}.contentHash`, "계산된 SHA-256과 일치하지 않습니다. 필드를 생략하면 자동 계산합니다.");
    if (hashes.has(hash)) error(`${path}.contentHash`, "파일 내 문제 내용이 중복됩니다.");
    hashes.add(hash);
    const sourceType = enumeration(q.sourceType, importSourceTypes, `${path}.sourceType`);
    const sourceUrl = url(q.sourceUrl, `${path}.sourceUrl`);
    if (sourceType === "RESTORED_EXAM" && !sourceUrl) error(`${path}.sourceUrl`, "복원 참고 문제에는 출처 URL이 필요합니다.");
    let acceptedAnswers: string[] | null = null;
    if (q.acceptedAnswers !== undefined && q.acceptedAnswers !== null) {
      if (!Array.isArray(q.acceptedAnswers)) error(`${path}.acceptedAnswers`, "문자열 배열이 필요합니다.");
      else acceptedAnswers = q.acceptedAnswers.map((a, i) => str(a, `${path}.acceptedAnswers[${i}]`));
    }
    if (q.redistributionAllowed !== undefined && typeof q.redistributionAllowed !== "boolean") error(`${path}.redistributionAllowed`, "boolean이 필요합니다.");
    const answer = str(q.answer, `${path}.answer`);
    if ([answer, ...(acceptedAnswers ?? [])].some((a) => a.length > 10000)) error(`${path}.answer`, "대표·허용 정답은 제출 제한인 10,000자 이하여야 합니다.");
    return {
      title: q.title === undefined ? `${exam.title} ${n}번` : str(q.title, `${path}.title`),
      questionNumber: n, questionType: enumeration(q.questionType, questionTypes, `${path}.questionType`),
      topic: str(q.topic, `${path}.topic`), subTopic: str(q.subTopic, `${path}.subTopic`, false) || null,
      difficulty: enumeration(q.difficulty, difficulties, `${path}.difficulty`),
      language: q.language == null ? null : enumeration(q.language, languages, `${path}.language`),
      content, code, contentHash: hash, answer, acceptedAnswers,
      explanation: str(q.explanation, `${path}.explanation`, status === "VERIFIED"),
      verificationNote: str(q.verificationNote, `${path}.verificationNote`, status === "VERIFIED") || null,
      memoryTip: str(q.memoryTip, `${path}.memoryTip`, false) || null,
      examTip: str(q.examTip, `${path}.examTip`, false) || null,
      sourceType, sourceName: str(q.sourceName, `${path}.sourceName`), sourceUrl,
      secondarySourceUrl: url(q.secondarySourceUrl, `${path}.secondarySourceUrl`),
      sourceYear: exam.examYear, sourceRound: exam.examRound, verificationStatus: status,
      redistributionAllowed: q.redistributionAllowed === true,
    };
  });
  if (errors.length) throw new ValidationError(errors);
  return { exam, problems: questions };
}

function existingExam(db: BetterSQLite3Database, exam: Exam) {
  return db.select().from(examSets).where(and(eq(examSets.certification, exam.certification), eq(examSets.examYear, exam.examYear), eq(examSets.examRound, exam.examRound))).get();
}

export function checkDatabase(db: BetterSQLite3Database, bundle: Bundle) {
  const exam = existingExam(db, bundle.exam), errors: string[] = [];
  // ponytail: scan existing content to include legacy rows without hashes; backfill and indexed lookup if the local bank grows large.
  const stored = db.select({ id: problems.id, examSetId: problems.examSetId, questionNumber: problems.questionNumber, content: problems.content, code: problems.code }).from(problems).all();
  const byHash = new Map<string, typeof stored>();
  for (const row of stored) {
    const hash = contentHash(row.content, row.code);
    byHash.set(hash, [...(byHash.get(hash) ?? []), row]);
  }
  bundle.problems.forEach((q, i) => {
    if ((byHash.get(q.contentHash!) ?? []).some((row) => row.examSetId !== exam?.id || row.questionNumber !== q.questionNumber)) errors.push(`problems[${i}].contentHash: 다른 문제와 내용이 중복됩니다.`);
  });
  if (exam && stored.some((row) => row.examSetId === exam.id && row.questionNumber! > bundle.exam.questionCount)) errors.push("exam.questionCount: 기존 문제 번호보다 작게 줄일 수 없습니다.");
  if (errors.length) throw new ValidationError(errors);
}

function changed(old: object, next: object) {
  return Object.entries(next).some(([key, value]) => JSON.stringify(old[key as keyof typeof old]) !== JSON.stringify(value));
}

export function importBundle(db: BetterSQLite3Database, input: unknown, resolveConflicts = false) {
  const bundle = validateBundle(input);
  return db.transaction((tx) => {
    checkDatabase(tx, bundle);
    const counts = { inserted: 0, updated: 0, skipped: 0, conflicted: 0 };
    let exam = existingExam(tx, bundle.exam);
    if (!exam) exam = tx.insert(examSets).values(bundle.exam).returning().get();
    else if (changed(exam, bundle.exam)) tx.update(examSets).set(bundle.exam).where(eq(examSets.id, exam.id)).run();
    for (const q of bundle.problems) {
      const old = tx.select().from(problems).where(and(eq(problems.examSetId, exam.id), eq(problems.questionNumber, q.questionNumber!))).get();
      const next = { ...q, examSetId: exam.id };
      if (!old) {
        tx.insert(problems).values(next).run();
        counts.inserted++;
        continue;
      }
      const conflict = old.verificationStatus === "CONFLICTED" || contentHash(old.content, old.code) !== q.contentHash
        || old.answer !== q.answer || JSON.stringify(old.acceptedAnswers ?? []) !== JSON.stringify(q.acceptedAnswers ?? []);
      if (conflict && !(resolveConflicts && q.verificationStatus === "VERIFIED" && q.verificationNote)) {
        if (old.verificationStatus !== "CONFLICTED") tx.update(problems).set({ verificationStatus: "CONFLICTED" }).where(eq(problems.id, old.id)).run();
        counts.conflicted++;
      } else if (changed(old, next)) {
        tx.update(problems).set(next).where(eq(problems.id, old.id)).run();
        counts.updated++;
      } else counts.skipped++;
    }
    return counts;
  }, { behavior: "immediate" });
}
