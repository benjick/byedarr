import { and, eq, notInArray, sql } from "drizzle-orm";

import { config, managers } from "../config";
import { db } from "../db";
import { mediaItems } from "../db/schema/media";

export async function updateDatabase() {
  for (const arr of config.mediaManagers) {
    const emoji = arr.type === "radarr" ? "🎬" : "📺";
    const client = managers[arr.id];
    if (!client) {
      throw new Error(`Missing manager for ${arr.id}`);
    }

    const updatedAt = new Date();

    const items = await client.getAll();
    console.log(`${emoji} [${arr.id}] got ${items.length} items`);

    if (!items.length) {
      continue;
    }

    const inserted = await db
      .insert(mediaItems)
      .values(items)
      .onConflictDoUpdate({
        target: mediaItems.id,
        set: {
          updatedAt,
          sizeOnDisk: sql`EXCLUDED.size_on_disk`,
          addedToManager: sql`EXCLUDED.added_to_manager`,
          pathOnDisk: sql`EXCLUDED.path_on_disk`,
          hasFile: sql`EXCLUDED.has_file`,
          imdbId: sql`EXCLUDED.imdb_id`,
          tmdbId: sql`EXCLUDED.tmdb_id`,
          rating: sql`EXCLUDED.rating`,
          releaseDate: sql`EXCLUDED.release_date`,
          year: sql`EXCLUDED.year`,
          title: sql`EXCLUDED.title`,
          image: sql`EXCLUDED.image`,
        },
      })
      .returning();

    const insertedIds = inserted.map((i) => i.id);
    console.log(`${emoji} [${arr.id}] ${insertedIds.length} items inserted`);

    const deleteRes = await db
      .delete(mediaItems)
      .where(
        and(
          notInArray(mediaItems.id, insertedIds),
          eq(mediaItems.managerConfigId, arr.id),
        ),
      );
    console.log(`${emoji} [${arr.id}] old items deleted`);
  }
}
