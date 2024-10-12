import crypto from "crypto";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  ActionRowBuilder,
  ApplicationCommandType,
  CommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

import { approveAdmin, getAdminOtp, wantsAdmin } from "../../lib/admin";
import { discordClient } from "../client";

dayjs.extend(relativeTime);

discordClient.once("ready", async () => {
  await discordClient.application?.commands.create({
    name: "make-me-admin",
    description: "Request to be added to the admin list",
    type: ApplicationCommandType.ChatInput,
  });
  console.log("✅ make-me-admin command registered");
});

discordClient.on("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    const { commandName } = interaction;

    if (commandName === "make-me-admin") {
      await handleMakeMeAdmin(interaction);
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === "otpModal") {
      const submittedOtp = interaction.fields.getTextInputValue("otpInput");
      const storedOtp = await getAdminOtp(interaction.user.id);

      if (submittedOtp !== storedOtp) {
        await interaction.reply({
          content: "Invalid OTP",
          ephemeral: true,
        });
        return;
      }

      await approveAdmin(interaction.user.id);

      await interaction.reply({
        content: "Congratulations! You are now an admin.",
        ephemeral: true,
      });
    }
  }
});

async function handleMakeMeAdmin(interaction: CommandInteraction) {
  const newAdmin = await wantsAdmin(interaction.user.id);
  console.log(
    `⚡️ OTP for ${interaction.user.username} (${interaction.user.id}): ${newAdmin.otp}`,
  );

  // Create a modal
  const modal = new ModalBuilder()
    .setCustomId("otpModal")
    .setTitle("Enter OTP");

  // Add input field to the modal
  const otpInput = new TextInputBuilder()
    .setCustomId("otpInput")
    .setLabel(`Enter the OTP`)
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const actionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    otpInput,
  );
  modal.addComponents(actionRow);

  // Show the modal to the user
  await interaction.showModal(modal);
}
