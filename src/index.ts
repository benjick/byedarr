import { and, eq, lt, sql } from "drizzle-orm";
import { schedule } from "node-cron";
import prettyBytes from "pretty-bytes";

import { incomingConfig, managers } from "./config";
import { db } from "./db";
import { mediaItems } from "./db/schema/media";
import { MediaItem } from "./lib/types";

async function main() {
  console.log(process.env.NODE_ENV);
  if (process.env.NODE_ENV === "development") {
    // await updateDatabase();
    await determineDeletions();
  }
}

schedule(incomingConfig.cronSchedule, async () => {
  console.log("⏰ Running cron");
  await updateDatabase();
  await determineDeletions();
});

async function updateDatabase() {
  for (const arr of incomingConfig.arrs) {
    const emoji = arr.type === "radarr" ? "🎬" : "📺";
    const client = managers[arr.id];
    if (!client) {
      throw new Error("Missing manager");
    }
    console.log(`${emoji} [${arr.id}] Running cron`);
    const existing = await db.query.mediaItems.findMany({
      where: eq(mediaItems.managerConfigId, arr.id),
    });
    const updatedAt = new Date();
    console.log(`${emoji} [${arr.id}] ${existing.length} existing items`);

    const items = await client.getAll();
    console.log(`${emoji} [${arr.id}] ${items.length} items`);

    if (!items.length) {
      continue;
    }

    console.log(items[0]);

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
          imdbRating: sql`EXCLUDED.imdb_rating`,
          tmdbRating: sql`EXCLUDED.tmdb_rating`,
          releaseDate: sql`EXCLUDED.release_date`,
          year: sql`EXCLUDED.year`,
          title: sql`EXCLUDED.title`,
        },
      })
      .returning();

    const insertedIds = inserted.map((i) => i.id);
    console.log(`${emoji} [${arr.id}] ${insertedIds.length} items inserted`);

    // TODO: Remove items that are not in the new list
  }
}

async function determineDeletions() {
  const items = await db.query.mediaItems.findMany({});
  const { radarrItems, sonarrItems } = items.reduce(
    (acc, item) => {
      if (item.managerType === "radarr") {
        acc.radarrItems.push(item);
      } else if (item.managerType === "sonarr") {
        acc.sonarrItems.push(item);
      }
      return acc;
    },
    { radarrItems: [], sonarrItems: [] } as {
      radarrItems: MediaItem[];
      sonarrItems: MediaItem[];
    },
  );
  const radarrItemsWithScore = radarrItems.map((item) => ({
    title: item.title,
    score: calculateDeletionScore(item),
    imdbRating: item.imdbRating,
    tmdbRating: item.tmdbRating,
    added: item.addedToManager,
    type: item.managerType,
    path: item.pathOnDisk,
    size: prettyBytes(Number(item.sizeOnDisk ?? 0)),
  }));
  const radarrToDelete = radarrItemsWithScore.sort((a, b) => b.score - a.score);

  const sonarrItemsWithScore = sonarrItems.map((item) => ({
    title: item.title,
    score: calculateDeletionScore(item),
    imdbRating: item.imdbRating,
    tmdbRating: item.tmdbRating,
    added: item.addedToManager,
    type: item.managerType,
    path: item.pathOnDisk,
    size: prettyBytes(Number(item.sizeOnDisk ?? 0)),
  }));
  const sonarrToDelete = sonarrItemsWithScore.sort((a, b) => b.score - a.score);

  console.log(radarrToDelete.slice(0, 3), sonarrToDelete.slice(0, 3));
}

function calculateDeletionScore(item: MediaItem): number {
  if (item.pathOnDisk) {
    if (
      incomingConfig.ignoredPaths.some((path) =>
        item.pathOnDisk!.includes(path),
      )
    ) {
      return 0;
    }
  }
  if (!item.hasFile) {
    return 0;
  }

  const now = new Date();
  const ageInDays =
    (now.getTime() - item.addedToManager.getTime()) / (1000 * 60 * 60 * 24);

  // Normalize each factor to a 0-1 scale
  const ageScore = Math.min(ageInDays / 365, 1); // Max age score at 1 year
  const sizeScore = Math.min(
    (item.sizeOnDisk ? Number(item.sizeOnDisk) : 0) / (50 * 1024 * 1024 * 1024),
    1,
  ); // Max size score at 50GB
  const imdbScore = item.imdbRating ? (10 - item.imdbRating) / 10 : 0.5; // Invert so lower ratings score higher
  const tmdbScore = item.tmdbRating ? (10 - item.tmdbRating) / 10 : 0.5; // Invert so lower ratings score higher

  // Weight each factor (adjust these weights as needed)
  const weights = {
    age: 0.1,
    size: 0.3,
    imdb: 0.5,
    tmdb: 0.5,
  };

  // Calculate final score
  const score =
    (ageScore * weights.age +
      sizeScore * weights.size +
      imdbScore * weights.imdb +
      tmdbScore * weights.tmdb) *
    100; // Multiply by 100 to get a 0-100 score

  return score;
}

void main();
