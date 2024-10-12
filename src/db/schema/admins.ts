import { boolean, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const admins = pgTable("admins", {
  discordUserId: varchar("discord_user_id").primaryKey(),
  otp: varchar("otp").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
