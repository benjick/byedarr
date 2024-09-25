import { schedule } from "node-cron";

import { config } from "./config";
import { runMigrations } from "./db";
import { discordReadyPromise } from "./discord";
import { env } from "./env";
import { bot } from "./lib/bot";
import {
  determineDeletions,
  processDeletions,
} from "./services/deletionService";
import { updateDatabase } from "./services/updateService";
import {
  hasExistingVotingSessions,
  processVotingSessions,
} from "./services/votingService";

async function main() {
  await runMigrations();
  console.log(bot);
  if (env.DEBUG) {
    console.log("env:", env);
    console.log("config:", config);
  }
  await discordReadyPromise;

  const hasVotingSessions = await hasExistingVotingSessions();

  if (!hasVotingSessions) {
    console.log("🤖 First run detected, running initial checks");
    await updateDatabase();
    await determineDeletions();
  }

  schedule(config.cron.findMedia, async () => {
    console.log("⏰ Running cron");
    await updateDatabase();
    await determineDeletions();
  });

  schedule(config.cron.processVotes, async () => {
    console.log("🔄 Running cron");
    await Promise.all([processVotingSessions(), processDeletions()]);
  });

  if (env.NODE_ENV === "development") {
    void dev();
  }
}

async function dev() {
  // await determineDeletions();
  // await Promise.all([processVotingSessions(), processDeletions()]);
}

void main();
