import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { mediaItems } from "../db/schema/media";

export const insertMediaItemSchema = createInsertSchema(mediaItems);
export const selectMediaItemSchema = createSelectSchema(mediaItems);

export type MediaItemInsertSchema = z.infer<typeof insertMediaItemSchema>;
export type MediaItemSelectSchema = z.infer<typeof selectMediaItemSchema>;

export abstract class MediaManagerAbstract {
  abstract test(): Promise<void>;
  abstract getAll(): Promise<MediaItemInsertSchema[]>;
  abstract delete(id: number, addImportExclusion: boolean): Promise<void>;
}

export type PartialMediaWithScore = {
  id: string;
  title: string;
  year: number;
  score: number;
  rating: number;
  added: Date;
  type: "radarr" | "sonarr";
  size: string;
  imdbId?: string;
  image?: string;
};

export type DiscordMessageVotes = {
  keepVotes: number;
  deleteVotes: number;
};
