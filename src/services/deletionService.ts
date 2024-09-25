import { and, eq, isNull, lt, lte } from "drizzle-orm";
import prettyBytes from "pretty-bytes";

import { Weights, config, managers } from "../config";
import { db } from "../db";
import { itemsToDelete } from "../db/schema/voting";
import {
  sendDeletionCandidatesToDiscord,
  updateDiscordMessage,
} from "../discord/client";
import { env } from "../env";
import { getPastDate } from "../lib/date";
import { MediaItemInsertSchema, PartialMediaWithScore } from "../lib/types";

export async function determineDeletions() {
  const votingSessionsRes = await db.query.votingSessions.findMany({});
  const whitelistedItems = await db.query.whitelist.findMany({});
  const whitelistedItemIds = whitelistedItems.map((item) => item.id);
  const votingSessionIds = votingSessionsRes.map((session) => session.id);
  const allItems = await db.query.mediaItems.findMany({
    where: (table) =>
      lt(table.addedToManager, getPastDate(config.immunityPeriod)),
  });
  const items = allItems.filter(
    (item) =>
      !votingSessionIds.includes(item.id) &&
      !whitelistedItemIds.includes(item.id),
  );

  const candidates = config.mediaManagers
    .filter((m) => m.enabled)
    .flatMap((m) => determineDeletionsForManager(items, m.id));

  await sendDeletionCandidatesToDiscord(candidates);
}

function determineDeletionsForManager(
  items: MediaItemInsertSchema[],
  managerConfigId: string,
): PartialMediaWithScore[] {
  const managerConfig = config.mediaManagers.find(
    (m) => m.id === managerConfigId,
  );
  if (!managerConfig) {
    throw new Error(`Missing manager config for ${managerConfigId}`);
  }
  const itemsWithScore = items
    .filter((item) => item.managerConfigId === managerConfigId)
    .map((item) => ({
      id: item.id,
      title: item.title,
      score: calculateDeletionScore(item, managerConfig.weights),
      rating: item.rating ?? 0,
      added: item.addedToManager,
      type: item.managerType,
      path: item.pathOnDisk,
      size: prettyBytes(Number(item.sizeOnDisk ?? 0)),
      year: item.year ?? 0,
      image: item.image ?? undefined,
      imdbId: item.imdbId ?? undefined,
    }));

  const sortedItems = itemsWithScore.sort((a, b) => b.score - a.score);
  return sortedItems.slice(0, managerConfig.count);
}

export async function processDeletions() {
  const deletions = await db.query.itemsToDelete.findMany({
    where: (table) =>
      and(lte(table.deleteAfter, new Date()), isNull(table.deletedAt)),
    with: {
      mediaItem: true,
    },
  });
  for (const deletion of deletions) {
    const managerConfig = config.mediaManagers.find(
      (m) => m.id === deletion.mediaItem.managerConfigId,
    );
    if (!managerConfig) {
      console.error(`Missing manager config for ${deletion.mediaItem.id}`);
      continue;
    }
    const manager = managers[managerConfig.id];
    if (!manager) {
      console.error(`Missing manager for ${deletion.mediaItem.id}`);
      continue;
    }
    console.log(
      `Deleting ${deletion.mediaItem.title} (${deletion.mediaItem.year})`,
    );
    if (!env.DRY_RUN) {
      await manager.delete(
        deletion.mediaItem.managerId,
        managerConfig.addImportExclusionOnDelete,
      );
    }
    const votingSession = await db.query.votingSessions.findFirst({
      where: (table) => eq(table.id, deletion.mediaItem.id),
    });
    if (votingSession) {
      await updateDiscordMessage(
        votingSession.discordMessageId,
        "deleted",
        "🚮 Deleted",
      );
    }
    await db
      .update(itemsToDelete)
      .set({ deletedAt: new Date() })
      .where(eq(itemsToDelete.id, deletion.mediaItem.id));
  }
}

const ONE_YEAR_IN_DAYS = 365;
const FIFTY_GB_IN_BYTES = 50 * 1024 * 1024 * 1024;

export function calculateDeletionScore(
  item: MediaItemInsertSchema,
  weights: Weights,
): number {
  if (item.pathOnDisk) {
    if (config.ignoredPaths.some((path) => item.pathOnDisk!.includes(path))) {
      return 0;
    }
  }
  if (!item.hasFile) {
    return 0;
  }

  const now = new Date();
  const ageInDays =
    (now.getTime() - item.addedToManager.getTime()) / (1000 * 60 * 60 * 24);

  const ageScore = Math.min(ageInDays / ONE_YEAR_IN_DAYS, 1);
  const sizeScore = Math.min(
    (item.sizeOnDisk ? Number(item.sizeOnDisk) : 0) / FIFTY_GB_IN_BYTES,
    1,
  );
  const ratingScore = item.rating ? (10 - item.rating) / 10 : 0.5;

  const score =
    (ageScore * weights.age +
      sizeScore * weights.size +
      ratingScore * weights.rating) *
    100;

  return score;
}
