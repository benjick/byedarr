import { ApplicationCommandType, CommandInteraction } from "discord.js";
import { eq } from "drizzle-orm";

import { db } from "../../db";
import { subscribers } from "../../db/schema/subscribers";
import { discordClient } from "../client";

discordClient.once("ready", () => {
  discordClient.application?.commands.create({
    name: "subscribe",
    description: "Subscribe to voting notifications for vote candidates",
    type: ApplicationCommandType.ChatInput,
  });

  discordClient.application?.commands.create({
    name: "unsubscribe",
    description: "Unsubscribe from voting notifications for vote candidates",
    type: ApplicationCommandType.ChatInput,
  });
});

discordClient.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "subscribe") {
    await handleSubscribe(interaction);
  } else if (commandName === "unsubscribe") {
    await handleUnsubscribe(interaction);
  }
});

async function handleSubscribe(interaction: CommandInteraction) {
  const discordUserId = interaction.user.id;
  const existingSubscriber = await db.query.subscribers.findFirst({
    where: (table) => eq(table.discordUserId, discordUserId),
  });

  if (existingSubscriber) {
    await interaction.reply({
      content: "You are already subscribed!",
      ephemeral: true,
    });
    return;
  }

  await db.insert(subscribers).values({ discordUserId });
  await interaction.reply({
    content: "You have been subscribed to voting notifications!",
    ephemeral: true,
  });
}

async function handleUnsubscribe(interaction: CommandInteraction) {
  const discordUserId = interaction.user.id;

  const existingSubscriber = await db.query.subscribers.findFirst({
    where: (table) => eq(table.discordUserId, discordUserId),
  });

  if (!existingSubscriber) {
    await interaction.reply({
      content: "You are not currently subscribed.",
      ephemeral: true,
    });
    return;
  }

  await db
    .delete(subscribers)
    .where(eq(subscribers.discordUserId, discordUserId));
  await interaction.reply({
    content: "You have been unsubscribed from voting notifications.",
    ephemeral: true,
  });
}
