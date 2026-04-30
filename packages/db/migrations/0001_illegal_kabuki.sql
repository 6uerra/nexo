CREATE TYPE "public"."email_status" AS ENUM('pending', 'sent', 'failed');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"to_email" varchar(200) NOT NULL,
	"subject" varchar(300) NOT NULL,
	"template" varchar(64) NOT NULL,
	"status" "email_status" DEFAULT 'pending' NOT NULL,
	"error_message" text,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password_hash" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "activation_token" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "activation_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_token" varchar(100);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_reset_expires_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_log_tenant_idx" ON "email_log" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "email_log_status_idx" ON "email_log" USING btree ("status");