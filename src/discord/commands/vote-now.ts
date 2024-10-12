import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ApplicationCommandType, CommandInteraction } from "discord.js";

import { isAdmin } from "../../lib/admin";
import { determineDeletions } from "../../services/deletionService";
import { updateDatabase } from "../../services/updateService";
import { discordClient } from "../client";

dayjs.extend(relativeTime);

discordClient.once("ready", async () => {
  await discordClient.application?.commands.create({
    name: "vote-now",
    description: "Create a vote right now (admin only)",
    type: ApplicationCommandType.ChatInput,
  });
  console.log("✅ vote-now command registered");
});

discordClient.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === "vote-now") {
    await handleVoteNow(interaction);
  }
});

async function handleVoteNow(interaction: CommandInteraction) {
  if (!(await isAdmin(interaction.user.id))) {
    await interaction.reply({
      content: "You are not an admin",
      ephemeral: true,
    });
    return;
  }
  await updateDatabase();
  await determineDeletions();
  await interaction.reply({
    content: `Created new voting session`,
    ephemeral: true,
  });
}
