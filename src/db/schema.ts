import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const questionTypes = [
  "CODE_OUTPUT", "SQL_OUTPUT", "NORMALIZATION", "NETWORK_CALCULATION", "SHORT_ANSWER",
] as const;
export const difficulties = ["EASY", "MEDIUM", "HARD"] as const;
export const importSourceTypes = ["RESTORED_EXAM", "JUNGSIL_PREDICTED", "SAMPLE", "MANUAL"] as const;
export const sourceTypes = [...importSourceTypes, "GAMJA_REFERENCE", "MOONEO_REFERENCE"] as const;
export const verificationStatuses = ["DRAFT", "REVIEW_REQUIRED", "CONFLICTED", "VERIFIED"] as const;
export const languages = ["Java", "C", "Python", "SQL"] as const;

export const examSets = sqliteTable("exam_sets", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  certification: text("certification").notNull(),
  examYear: integer("exam_year").notNull(),
  examRound: integer("exam_round").notNull(),
  examDate: text("exam_date").notNull(),
  title: text("title").notNull(),
  questionCount: integer("question_count").notNull(),
  sourceType: text("source_type", { enum: importSourceTypes }).notNull(),
  verificationStatus: text("verification_status", { enum: verificationStatuses }).notNull().default("REVIEW_REQUIRED"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`).$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex("exam_identity").on(table.certification, table.examYear, table.examRound),
  check("exam_source_check", sql`${table.sourceType} in ('RESTORED_EXAM', 'JUNGSIL_PREDICTED', 'SAMPLE', 'MANUAL')`),
  check("exam_status_check", sql`${table.verificationStatus} in ('DRAFT', 'REVIEW_REQUIRED', 'CONFLICTED', 'VERIFIED')`),
  check("exam_numbers_check", sql`${table.questionCount} > 0 and ${table.examRound} > 0 and ${table.examYear} between 1900 and 9999`),
]);

export const problems = sqliteTable("problems", {
  examSetId: text("exam_set_id").references(() => examSets.id),
  questionNumber: integer("question_number"),
  subTopic: text("sub_topic"),
  code: text("code"),
  memoryTip: text("memory_tip"),
  examTip: text("exam_tip"),
  secondarySourceUrl: text("secondary_source_url"),
  verificationStatus: text("verification_status", { enum: verificationStatuses }).notNull().default("REVIEW_REQUIRED"),
  verificationNote: text("verification_note"),
  contentHash: text("content_hash"),
  redistributionAllowed: integer("redistribution_allowed", { mode: "boolean" }).notNull().default(false),
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  content: text("content").notNull(),
  answer: text("answer").notNull(),
  acceptedAnswers: text("accepted_answers", { mode: "json" }).$type<string[]>(),
  explanation: text("explanation").notNull(),
  questionType: text("question_type", { enum: questionTypes }).notNull(),
  topic: text("topic").notNull(),
  difficulty: text("difficulty", { enum: difficulties }).notNull(),
  language: text("language"),
  sourceType: text("source_type", { enum: sourceTypes }).notNull(),
  sourceName: text("source_name").notNull(),
  sourceUrl: text("source_url"),
  sourceYear: integer("source_year"),
  sourceRound: integer("source_round"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),
}, (table) => [
  check("question_type_check", sql`${table.questionType} in ('CODE_OUTPUT', 'SQL_OUTPUT', 'NORMALIZATION', 'NETWORK_CALCULATION', 'SHORT_ANSWER')`),
  check("difficulty_check", sql`${table.difficulty} in ('EASY', 'MEDIUM', 'HARD')`),
  check("source_type_check", sql`${table.sourceType} in ('SAMPLE', 'MANUAL', 'GAMJA_REFERENCE', 'MOONEO_REFERENCE', 'RESTORED_EXAM', 'JUNGSIL_PREDICTED')`),
  check("problem_status_check", sql`${table.verificationStatus} in ('DRAFT', 'REVIEW_REQUIRED', 'CONFLICTED', 'VERIFIED')`),
  check("problem_number_check", sql`(${table.examSetId} is null and ${table.questionNumber} is null) or (${table.examSetId} is not null and ${table.questionNumber} is not null and ${table.questionNumber} > 0)`),
  uniqueIndex("problem_exam_number").on(table.examSetId, table.questionNumber),
  uniqueIndex("problem_content_hash").on(table.contentHash),
]);

export type Problem = typeof problems.$inferSelect;
