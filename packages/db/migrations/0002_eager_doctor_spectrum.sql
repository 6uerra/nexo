CREATE TABLE IF NOT EXISTS "platform_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(32) NOT NULL,
	"name" varchar(100) NOT NULL,
	"tagline" varchar(200),
	"description" text,
	"price_cop" integer,
	"price_label" varchar(50),
	"show_price" boolean DEFAULT false NOT NULL,
	"vehicle_limit" integer,
	"modules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"highlights" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"highlighted" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_plans_key_unique" UNIQUE("key")
);
