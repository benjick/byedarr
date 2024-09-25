import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { mediaItems } from "./media";

export const voteOutcomeEnum = pgEnum("vote_outcome", ["keep", "delete"]);

export const votingSessions = pgTable(
  "voting_sessions",
  {
    id: varchar("id")
      .primaryKey()
      .references(() => mediaItems.id, {
        onDelete: "cascade",
      }),
    discordMessageId: varchar("discord_message_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    endsAt: timestamp("ends_at").notNull(),
    handled: boolean("handled").default(false).notNull(),
    voteOutcome: voteOutcomeEnum("vote_outcome"),
  },
  (table) => ({
    discordMessageIdIdx: index("discord_message_id_idx").on(
      table.discordMessageId,
    ),
    handledIdx: index("handled_idx").on(table.handled),
  }),
);

export const votingSessionsRelations = relations(votingSessions, ({ one }) => ({
  mediaItem: one(mediaItems, {
    fields: [votingSessions.id],
    references: [mediaItems.id],
  }),
}));

export const itemsToDelete = pgTable("items_to_delete", {
  id: varchar("id")
    .primaryKey()
    .references(() => mediaItems.id, {
      onDelete: "cascade",
    }),
  deleteAfter: timestamp("delete_after").notNull(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const itemsToDeleteRelations = relations(itemsToDelete, ({ one }) => ({
  mediaItem: one(mediaItems, {
    fields: [itemsToDelete.id],
    references: [mediaItems.id],
  }),
}));

export const whitelist = pgTable("whitelist", {
  id: varchar("id")
    .primaryKey()
    .references(() => mediaItems.id, {
      onDelete: "cascade",
    }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const whitelistRelations = relations(whitelist, ({ one }) => ({
  mediaItem: one(mediaItems, {
    fields: [whitelist.id],
    references: [mediaItems.id],
  }),
}));
