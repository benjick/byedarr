DO $$ BEGIN
 CREATE TYPE "public"."manager_type" AS ENUM('radarr', 'sonarr');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."vote_outcome" AS ENUM('keep', 'delete');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "media_items" (
	"id" varchar PRIMARY KEY NOT NULL,
	"manager_id" integer NOT NULL,
	"manager_type" "manager_type" NOT NULL,
	"manager_config_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"size_on_disk" numeric DEFAULT '0' NOT NULL,
	"release_date" timestamp NOT NULL,
	"year" integer,
	"has_file" boolean DEFAULT false,
	"imdb_id" varchar,
	"tmdb_id" integer,
	"rating" real,
	"added_to_manager" timestamp NOT NULL,
	"path_on_disk" varchar,
	"image" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "media_items_manager_id_manager_config_id_unique" UNIQUE("manager_id","manager_config_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscribers" (
	"discord_user_id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "items_to_delete" (
	"id" varchar PRIMARY KEY NOT NULL,
	"delete_after" timestamp NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voting_sessions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"discord_message_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"ends_at" timestamp NOT NULL,
	"handled" boolean DEFAULT false NOT NULL,
	"vote_outcome" "vote_outcome"
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whitelist" (
	"id" varchar PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "items_to_delete" ADD CONSTRAINT "items_to_delete_id_media_items_id_fk" FOREIGN KEY ("id") REFERENCES "public"."media_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "voting_sessions" ADD CONSTRAINT "voting_sessions_id_media_items_id_fk" FOREIGN KEY ("id") REFERENCES "public"."media_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "whitelist" ADD CONSTRAINT "whitelist_id_media_items_id_fk" FOREIGN KEY ("id") REFERENCES "public"."media_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "manager_id_idx" ON "media_items" USING btree ("manager_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "manager_type_idx" ON "media_items" USING btree ("manager_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "manager_config_id_idx" ON "media_items" USING btree ("manager_config_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "added_to_manager_idx" ON "media_items" USING btree ("added_to_manager");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "discord_message_id_idx" ON "voting_sessions" USING btree ("discord_message_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "handled_idx" ON "voting_sessions" USING btree ("handled");