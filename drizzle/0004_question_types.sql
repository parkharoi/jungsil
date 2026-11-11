-- Keep the original CHECK and column; no table rebuild or record deletion.
ALTER TABLE problems RENAME COLUMN question_type TO legacy_question_type;
--> statement-breakpoint
ALTER TABLE problems ADD COLUMN question_type text NOT NULL DEFAULT 'SHORT_ANSWER'
CONSTRAINT question_type_v2_check CHECK(question_type in ('CODE_OUTPUT', 'SQL_OUTPUT', 'NORMALIZATION', 'NETWORK_CALCULATION', 'SHORT_ANSWER', 'SQL_BLANK', 'CODE_BLANK'));
--> statement-breakpoint
UPDATE problems SET question_type = legacy_question_type;
--> statement-breakpoint
ALTER TABLE problems ADD COLUMN answer_parts text;
