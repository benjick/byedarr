import {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  Message,
  Partials,
  TextChannel,
} from "discord.js";
import { eq } from "drizzle-orm";

import { config } from "../config";
import { db } from "../db";
import { votingSessions } from "../db/schema/voting";
import { env } from "../env";
import { getFutureDate } from "../lib/date";
import { DiscordMessageVotes, PartialMediaWithScore } from "../lib/types";

export const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

discordClient.login(env.DISCORD_BOT_TOKEN);

export const discordReadyPromise = new Promise<void>((resolve) => {
  discordClient.once("ready", () => {
    resolve();
  });
});

export async function sendDeletionCandidatesToDiscord(
  candidates: PartialMediaWithScore[],
) {
  const channel = discordClient.channels.cache.get(
    config.discord.channelId,
  ) as TextChannel;

  if (!channel) {
    console.error("Channel not found");
    return;
  }

  const subscribedUsers = await db.query.subscribers.findMany();
  const mentionString = subscribedUsers
    .map((user) => `<@${user.discordUserId}>`)
    .join(" ");

  if (candidates.length > 0 && subscribedUsers.length > 0) {
    await channel.send(
      `${mentionString}\nNew items are available for voting! Please check the following messages.`,
    );
  }

  for (const item of candidates) {
    const votingSession = await db.query.votingSessions.findFirst({
      where: (table) => eq(table.id, item.id),
    });
    if (votingSession) {
      console.log("Voting session already exists for this item");
      continue;
    }

    const endsAt = getFutureDate(config.votingPeriod);

    const embed = new EmbedBuilder()
      .setColor(discordColors.voting)
      .setTitle(`${item.title} (${item.year})`)
      .addFields(
        { name: "Size", value: item.size, inline: true },
        { name: "Added", value: item.added.toDateString(), inline: true },
        { name: "Ends At", value: endsAt.toDateString(), inline: true },
      )
      .setFooter({ text: "React with 👍 to keep, or 👎 to confirm deletion." });

    if (item.image) {
      embed.setThumbnail(item.image);
    }

    if (item.imdbId) {
      embed.setURL(`https://www.imdb.com/title/${item.imdbId}`);
    }

    if (item.rating) {
      embed.addFields({
        name: "Rating",
        value: item.rating.toString(),
        inline: true,
      });
    }

    const message = await channel.send({ embeds: [embed] });

    await Promise.all([message.react("👍"), message.react("👎")]);

    await db.insert(votingSessions).values({
      id: item.id,
      discordMessageId: message.id,
      endsAt: getFutureDate(config.votingPeriod),
    });
  }
}

export async function fetchDiscordMessage(
  messageId: string,
): Promise<Message | null> {
  try {
    const channel = discordClient.channels.cache.get(
      config.discord.channelId,
    ) as TextChannel;
    if (!channel) {
      console.error(`Channel with ID ${config.discord.channelId} not found`);
      return null;
    }

    const message = await channel.messages.fetch(messageId);
    return message;
  } catch (error) {
    console.error(`Error fetching message: ${error}`);
    return null;
  }
}

export async function fetchDiscordMessageVotes(
  messageId: string,
): Promise<DiscordMessageVotes | null> {
  try {
    const message = await fetchDiscordMessage(messageId);
    if (!message) {
      console.error(`Message with ID ${messageId} not found`);
      return null;
    }
    const keepVotes = message.reactions.cache.get("👍")?.count ?? 0;
    const deleteVotes = message.reactions.cache.get("👎")?.count ?? 0;
    return { keepVotes, deleteVotes };
  } catch (error) {
    console.error(`Error fetching message: ${error}`);
    return null;
  }
}

const discordColors = {
  voting: "#FF00FF",
  keep: "#FFFFFF",
  delete: "#FF0000",
  deleted: "#000000",
} as const;

export async function updateDiscordMessage(
  messageId: string,
  color: keyof typeof discordColors,
  footerText: string,
) {
  const message = await fetchDiscordMessage(messageId);
  if (message) {
    const embed = message.embeds[0];
    const updatedEmbed = EmbedBuilder.from(embed)
      .setFooter({
        text: footerText,
      })
      .setColor(discordColors[color]);

    await message.edit({ embeds: [updatedEmbed] });
  }
}
