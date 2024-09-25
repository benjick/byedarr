import { ApplicationCommandType, CommandInteraction } from "discord.js";

import { config } from "../../config";
import { discordClient } from "../client";

discordClient.once("ready", () => {
  discordClient.application?.commands.create({
    name: "config",
    description: "Show the current config",
    type: ApplicationCommandType.ChatInput,
  });
});

discordClient.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "config") {
    await handleConfig(interaction);
  }
});

async function handleConfig(interaction: CommandInteraction) {
  const configToShow = {
    votingPeriod: config.votingPeriod,
    gracePeriod: config.gracePeriod,
    immunityPeriod: config.immunityPeriod,
    onDraw: config.onDraw,
    dryRun: config.dryRun,
  };
  await interaction.reply({
    content: `Current config:\n${JSON.stringify(configToShow, null, 2)}`,
    ephemeral: true,
  });
}
