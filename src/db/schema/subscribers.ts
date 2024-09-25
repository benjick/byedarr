import { pgTable, timestamp, varchar } from "drizzle-orm/pg-core";

export const subscribers = pgTable("subscribers", {
  discordUserId: varchar("discord_user_id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
