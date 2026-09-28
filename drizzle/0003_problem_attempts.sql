CREATE TABLE `problem_attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`problem_id` text NOT NULL,
	`user_answer` text NOT NULL,
	`correct` integer NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`started_at` integer,
	`submitted_at` integer DEFAULT (unixepoch()) NOT NULL,
	`duration_seconds` integer,
	`attempt_context` text DEFAULT 'PRACTICE' NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`problem_id`) REFERENCES `problems`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "attempt_score_check" CHECK(("problem_attempts"."correct" = 1 and "problem_attempts"."score" = 5) or ("problem_attempts"."correct" = 0 and "problem_attempts"."score" = 0)),
	CONSTRAINT "attempt_context_check" CHECK("problem_attempts"."attempt_context" in ('PRACTICE', 'PAST_EXAM_SESSION', 'MOCK_EXAM', 'WRONG_ANSWER_RETRY')),
	CONSTRAINT "attempt_duration_check" CHECK(("problem_attempts"."started_at" is null and "problem_attempts"."duration_seconds" is null) or ("problem_attempts"."started_at" is not null and "problem_attempts"."duration_seconds" is not null and "problem_attempts"."duration_seconds" >= 0 and "problem_attempts"."submitted_at" >= "problem_attempts"."started_at" and "problem_attempts"."duration_seconds" = "problem_attempts"."submitted_at" - "problem_attempts"."started_at"))
);
--> statement-breakpoint
CREATE INDEX `attempt_problem_idx` ON `problem_attempts` (`problem_id`);--> statement-breakpoint
CREATE INDEX `attempt_submitted_idx` ON `problem_attempts` (`submitted_at`);--> statement-breakpoint
CREATE INDEX `attempt_correct_problem_idx` ON `problem_attempts` (`correct`,`problem_id`);