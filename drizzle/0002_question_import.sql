CREATE TABLE `exam_sets` (
	`id` text PRIMARY KEY NOT NULL,
	`certification` text NOT NULL,
	`exam_year` integer NOT NULL,
	`exam_round` integer NOT NULL,
	`exam_date` text NOT NULL,
	`title` text NOT NULL,
	`question_count` integer NOT NULL,
	`source_type` text NOT NULL,
	`verification_status` text DEFAULT 'REVIEW_REQUIRED' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	CONSTRAINT "exam_source_check" CHECK("exam_sets"."source_type" in ('RESTORED_EXAM', 'JUNGSIL_PREDICTED', 'SAMPLE', 'MANUAL')),
	CONSTRAINT "exam_status_check" CHECK("exam_sets"."verification_status" in ('DRAFT', 'REVIEW_REQUIRED', 'CONFLICTED', 'VERIFIED')),
	CONSTRAINT "exam_numbers_check" CHECK("exam_sets"."question_count" > 0 and "exam_sets"."exam_round" > 0 and "exam_sets"."exam_year" between 1900 and 9999)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `exam_identity` ON `exam_sets` (`certification`,`exam_year`,`exam_round`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_problems` (
	`exam_set_id` text,
	`question_number` integer,
	`sub_topic` text,
	`code` text,
	`memory_tip` text,
	`exam_tip` text,
	`secondary_source_url` text,
	`verification_status` text DEFAULT 'REVIEW_REQUIRED' NOT NULL,
	`verification_note` text,
	`content_hash` text,
	`redistribution_allowed` integer DEFAULT false NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`answer` text NOT NULL,
	`accepted_answers` text,
	`explanation` text NOT NULL,
	`question_type` text NOT NULL,
	`topic` text NOT NULL,
	`difficulty` text NOT NULL,
	`language` text,
	`source_type` text NOT NULL,
	`source_name` text NOT NULL,
	`source_url` text,
	`source_year` integer,
	`source_round` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`exam_set_id`) REFERENCES `exam_sets`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "question_type_check" CHECK("__new_problems"."question_type" in ('CODE_OUTPUT', 'SQL_OUTPUT', 'NORMALIZATION', 'NETWORK_CALCULATION', 'SHORT_ANSWER')),
	CONSTRAINT "difficulty_check" CHECK("__new_problems"."difficulty" in ('EASY', 'MEDIUM', 'HARD')),
	CONSTRAINT "source_type_check" CHECK("__new_problems"."source_type" in ('SAMPLE', 'MANUAL', 'GAMJA_REFERENCE', 'MOONEO_REFERENCE', 'RESTORED_EXAM', 'JUNGSIL_PREDICTED')),
	CONSTRAINT "problem_status_check" CHECK("__new_problems"."verification_status" in ('DRAFT', 'REVIEW_REQUIRED', 'CONFLICTED', 'VERIFIED')),
	CONSTRAINT "problem_number_check" CHECK(("__new_problems"."exam_set_id" is null and "__new_problems"."question_number" is null) or ("__new_problems"."exam_set_id" is not null and "__new_problems"."question_number" is not null and "__new_problems"."question_number" > 0))
);
--> statement-breakpoint
INSERT INTO `__new_problems`("id", "title", "content", "answer", "accepted_answers", "explanation", "question_type", "topic", "difficulty", "language", "source_type", "source_name", "source_url", "source_year", "source_round", "created_at", "updated_at") SELECT "id", "title", "content", "answer", "accepted_answers", "explanation", "question_type", "topic", "difficulty", "language", "source_type", "source_name", "source_url", "source_year", "source_round", "created_at", "updated_at" FROM `problems`;--> statement-breakpoint
DROP TABLE `problems`;--> statement-breakpoint
ALTER TABLE `__new_problems` RENAME TO `problems`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `problem_exam_number` ON `problems` (`exam_set_id`,`question_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `problem_content_hash` ON `problems` (`content_hash`);
--> statement-breakpoint
UPDATE `problems` SET `verification_status` = 'VERIFIED', `verification_note` = '개발 검증용 자체 제작 문제', `redistribution_allowed` = 1
WHERE `source_type` = 'SAMPLE' AND `source_name` = 'JungSil Sample'
AND `id` IN ('sample-java-loop', 'sample-c-array', 'sample-sql-group', 'sample-normalization', 'sample-network-subnet');
