import {
  boolean,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  real,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

export const managerType = pgEnum("manager_type", ["radarr", "sonarr"]);

export const mediaItems = pgTable(
  "media_items",
  {
    id: varchar("id").primaryKey(),
    managerId: integer("manager_id").notNull(), // internal id used by radarr etc
    managerType: managerType("manager_type").notNull(), // e.g. radarr or sonarr
    managerConfigId: varchar("manager_config_id").notNull(), // e.g. radarr-1 in yaml config
    title: varchar("title").notNull(), // e.g. Burn After Reading
    sizeOnDisk: numeric("size_on_disk", {
      scale: 0,
    })
      .notNull()
      .default("0"), // e.g. 8738126038
    releaseDate: timestamp("release_date").notNull(),
    year: integer("year"),
    hasFile: boolean("has_file").default(false),
    imdbId: varchar("imdb_id"),
    tmdbId: integer("tmdb_id"),
    rating: real("rating"),
    addedToManager: timestamp("added_to_manager").notNull(),
    pathOnDisk: varchar("path_on_disk"),
    image: varchar("image"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    managerIdIdx: index("manager_id_idx").on(table.managerId),
    managerTypeIdx: index("manager_type_idx").on(table.managerType),
    managerConfigIdIdx: index("manager_config_id_idx").on(
      table.managerConfigId,
    ),
    addedToManagerIdx: index("added_to_manager_idx").on(table.addedToManager),
    unq: unique().on(table.managerId, table.managerConfigId),
  }),
);
