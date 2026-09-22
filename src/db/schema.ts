import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const questionTypes = [
  "CODE_OUTPUT", "SQL_OUTPUT", "NORMALIZATION", "NETWORK_CALCULATION", "SHORT_ANSWER",
] as const;
export const difficulties = ["EASY", "MEDIUM", "HARD"] as const;
export const sourceTypes = ["SAMPLE", "MANUAL", "GAMJA_REFERENCE", "MOONEO_REFERENCE"] as const;

export const problems = sqliteTable("problems", {
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
  check("source_type_check", sql`${table.sourceType} in ('SAMPLE', 'MANUAL', 'GAMJA_REFERENCE', 'MOONEO_REFERENCE')`),
]);

export type Problem = typeof problems.$inferSelect;
