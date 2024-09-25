import { and, eq, lte } from "drizzle-orm";

import { config } from "../config";
import { db } from "../db";
import { itemsToDelete, votingSessions, whitelist } from "../db/schema/voting";
import { fetchDiscordMessageVotes, updateDiscordMessage } from "../discord";
import { getFutureDate } from "../lib/date";
import { DiscordMessageVotes } from "../lib/types";

export async function processVotingSessions() {
  await db.transaction(async (tx) => {
    const votingSessionsRes = await tx.query.votingSessions.findMany({
      with: {
        mediaItem: true,
      },
      where: (table) =>
        and(lte(table.endsAt, new Date()), eq(table.handled, false)),
    });

    for (const votingSession of votingSessionsRes) {
      const results = await fetchDiscordMessageVotes(
        votingSession.discordMessageId,
      );
      if (!results) {
        console.log(`Message not found for ${votingSession.id}`);
        continue;
      }
      const decision = decideOnVotingSession(results);

      await tx
        .update(votingSessions)
        .set({
          handled: true,
          voteOutcome: decision,
        })
        .where(eq(votingSessions.id, votingSession.id));
      if (decision === "delete") {
        const [itemToDelete] = await tx
          .insert(itemsToDelete)
          .values({
            id: votingSession.mediaItem.id,
            deleteAfter: getFutureDate(config.gracePeriod),
          })
          .onConflictDoUpdate({
            target: itemsToDelete.id,
            set: {
              deleteAfter: getFutureDate(config.gracePeriod),
            },
          })
          .returning();
        await updateDiscordMessage(
          votingSession.discordMessageId,
          "delete",
          `👀 To be deleted after ${itemToDelete.deleteAfter}`,
        );
      } else if (decision === "keep") {
        await tx
          .insert(whitelist)
          .values({
            id: votingSession.mediaItem.id,
          })
          .onConflictDoNothing();
        await updateDiscordMessage(
          votingSession.discordMessageId,
          "keep",
          "🛟 Whitelisted",
        );
      }
    }
  });
}

function decideOnVotingSession(
  results: DiscordMessageVotes,
): "keep" | "delete" {
  const onDraw = config.onDraw;
  if (results.keepVotes === results.deleteVotes) {
    return onDraw;
  }
  if (results.keepVotes > results.deleteVotes) {
    return "keep" as const;
  }
  return "delete" as const;
}

export async function hasExistingVotingSessions() {
  const res = await db.query.votingSessions.findFirst({});
  return !!res;
}
