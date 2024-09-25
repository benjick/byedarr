import "dotenv/config";

import { envSchema } from "./envSchema";

const envMap = {
  DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
  CONFIG_PATH: process.env.CONFIG_PATH,
  DATABASE_URL: process.env.DATABASE_URL,
  SKIP_MIGRATIONS: process.env.SKIP_MIGRATIONS,
  DRY_RUN: process.env.DRY_RUN,
  DEBUG: process.env.DEBUG,
  NODE_ENV: process.env.NODE_ENV,
};

export const env = envSchema.parse(envMap);
