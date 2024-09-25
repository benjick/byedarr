import { ApplicationCommandType, CommandInteraction } from "discord.js";

import { discordClient } from "../client";

discordClient.once("ready", () => {
  discordClient.application?.commands.create({
    name: "help",
    description: "Get help with the bot",
    type: ApplicationCommandType.ChatInput,
  });
});

discordClient.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "help") {
    await handleHelp(interaction);
  }
});

const helpMessage = `
Use \`/subscribe\` to subscribe to notifications about new votes.

Read more at https://github.com/benjick/byedarr
`.trim();

async function handleHelp(interaction: CommandInteraction) {
  await interaction.reply({
    content: helpMessage,
    ephemeral: true,
  });
}
