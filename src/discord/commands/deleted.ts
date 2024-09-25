import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ApplicationCommandType, CommandInteraction } from "discord.js";
import { desc, isNotNull, isNull } from "drizzle-orm";

import { db } from "../../db";
import { itemsToDelete } from "../../db/schema/voting";
import { discordClient } from "../client";

discordClient.once("ready", () => {
  discordClient.application?.commands.create({
    name: "listdeleted",
    description: "List the latest deleted items",
    type: ApplicationCommandType.ChatInput,
  });
  discordClient.application?.commands.create({
    name: "listtobedeleted",
    description: "List the items that are scheduled to be deleted",
    type: ApplicationCommandType.ChatInput,
  });
});

discordClient.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "listdeleted") {
    await handleListDeleted(interaction);
  }
  if (commandName === "listtobedeleted") {
    await handleListToBeDeleted(interaction);
  }
});

async function handleListDeleted(interaction: CommandInteraction) {
  const latestDeletedItems = await db.query.itemsToDelete.findMany({
    limit: 10,
    orderBy: [desc(itemsToDelete.createdAt)],
    where: isNotNull(itemsToDelete.deletedAt),
    with: {
      mediaItem: true,
    },
  });

  if (latestDeletedItems.length === 0) {
    await interaction.reply({
      content: "There are no deleted items.",
      ephemeral: true,
    });
    return;
  }

  const itemList = latestDeletedItems
    .map((item, index) => `${index + 1}. ${item.mediaItem.title}`)
    .join("\n");

  await interaction.reply({
    content: `Latest deleted items:\n${itemList}`,
    ephemeral: true,
  });
}

async function handleListToBeDeleted(interaction: CommandInteraction) {
  const itemsToBeDeleted = await db.query.itemsToDelete.findMany({
    where: isNull(itemsToDelete.deletedAt),
    with: {
      mediaItem: true,
    },
  });

  if (itemsToBeDeleted.length === 0) {
    await interaction.reply({
      content: "There are no items scheduled to be deleted.",
      ephemeral: true,
    });
    return;
  }

  const itemList = itemsToBeDeleted
    .map((item, index) => {
      const timeLeft = dayjs(item.deleteAfter).fromNow();
      return `${index + 1}. ${item.mediaItem.title} (${timeLeft})`;
    })
    .join("\n");

  await interaction.reply({
    content: `Items scheduled to be deleted:\n${itemList}`,
    ephemeral: true,
  });
}
dayjs.extend(relativeTime);
