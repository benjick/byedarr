import { ApplicationCommandType, CommandInteraction } from "discord.js";
import { desc } from "drizzle-orm";

import { db } from "../../db";
import { whitelist } from "../../db/schema/voting";
import { discordClient } from "../client";

discordClient.once("ready", () => {
  discordClient.application?.commands.create({
    name: "listwhitelist",
    description: "List the latest whitelisted items",
    type: ApplicationCommandType.ChatInput,
  });
});

discordClient.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "listwhitelist") {
    await handleListWhitelist(interaction);
  }
});

async function handleListWhitelist(interaction: CommandInteraction) {
  const latestWhitelistedItems = await db.query.whitelist.findMany({
    limit: 10,
    orderBy: [desc(whitelist.createdAt)],
    with: {
      mediaItem: true,
    },
  });

  if (latestWhitelistedItems.length === 0) {
    await interaction.reply({
      content: "There are no whitelisted items.",
      ephemeral: true,
    });
    return;
  }

  const itemList = latestWhitelistedItems
    .map((item, index) => `${index + 1}. ${item.mediaItem.title}`)
    .join("\n");

  await interaction.reply({
    content: `Latest whitelisted items:\n${itemList}`,
    ephemeral: true,
  });
}
