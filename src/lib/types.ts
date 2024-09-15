import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

import { mediaItems } from "../db/schema/media";

export const insertMediaItemSchema = createInsertSchema(mediaItems);

export type MediaItem = z.infer<typeof insertMediaItemSchema>;

export abstract class MediaManager {
  abstract test(): Promise<void>;
  abstract getAll(): Promise<MediaItem[]>;
  // abstract getById(id: number): Promise<MediaItem | null>;
  // abstract delete(id: number): Promise<void>;
}
