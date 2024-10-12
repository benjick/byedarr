import { parseCronExpression } from "cron-schedule";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ApplicationCommandType, CommandInteraction } from "discord.js";

import { config } from "../../config";
import { discordClient } from "../client";

dayjs.extend(relativeTime);

discordClient.once("ready", () => {
  discordClient.application?.commands.create({
    name: "next-vote",
    description: "Show the time until the next vote",
    type: ApplicationCommandType.ChatInput,
  });
});

discordClient.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "next-vote") {
    await handleNextVote(interaction);
  }
});

async function handleNextVote(interaction: CommandInteraction) {
  const cron = parseCronExpression(config.cron.findMedia);
  const nextVote = cron.getNextDate();
  const timeLeft = dayjs(nextVote).fromNow();
  await interaction.reply({
    content: `The next vote is ${timeLeft} (${nextVote.toISOString()})`,
    ephemeral: true,
  });
}
