import { z } from "zod";

export const boolean = z.preprocess((val) => {
  if (typeof val === "string" && val !== "true") return false;
  return val;
}, z.coerce.boolean());

export const envSchema = z.object({
  DISCORD_BOT_TOKEN: z.string(),
  CONFIG_PATH: z.string(),
  DATABASE_URL: z
    .string()
    .url()
    .default("postgres://postgres:postgres@localhost:5432/postgres"),
  SKIP_MIGRATIONS: boolean.default(false),
  DRY_RUN: boolean.default(false),
  DEBUG: boolean.default(false),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});
