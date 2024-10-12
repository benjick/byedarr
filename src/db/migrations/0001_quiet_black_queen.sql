CREATE TABLE IF NOT EXISTS "admins" (
	"discord_user_id" varchar PRIMARY KEY NOT NULL,
	"otp" varchar NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
