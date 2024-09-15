import * as fs from "fs";
import * as yaml from "js-yaml";
import { validate } from "node-cron";
import { join } from "path";
import { z } from "zod";

import { RadarrManager, createRadarrClient } from "./lib/radarr";
import { SonarrManager, createSonarrClient } from "./lib/sonarr";
import { MediaManager } from "./lib/types";

const Arr = z.object({
  id: z.string().min(1),
  apiUrl: z.string().url(),
  apiKey: z.string(),
  type: z.enum(["radarr", "sonarr"]),
});

export type Arr = z.infer<typeof Arr>;

const Plex = z.object({
  url: z.string().url(),
  apiKey: z.string(),
});

const IncomingConfigSchema = z.object({
  cronSchedule: z
    .string()
    .default("0 18 * * *")
    .refine(
      (cron) => {
        return validate(cron);
      },
      {
        message: "Invalid cron schedule",
      },
    ),
  arrs: z.array(Arr).refine(
    (arrs) => {
      const ids = arrs.map((arr) => arr.id);
      return ids.length === new Set(ids).size; // Check for duplicates
    },
    {
      message: "Duplicate IDs found",
    },
  ),
  plex: Plex.optional(),
  ignoredPaths: z.array(z.string()).default([]),
});

type IncomingConfigSchema = z.infer<typeof IncomingConfigSchema>;

const configPath =
  process.env.CONFIG_PATH || join(__dirname, "..", "config.yml");
console.log("Config path:", configPath);
const rawConfig = yaml.load(fs.readFileSync(configPath, "utf8"));
const parsedConfig = IncomingConfigSchema.safeParse(rawConfig);

if (!parsedConfig.success) {
  console.error("Invalid config:", parsedConfig.error.message);
  process.exit(1);
}

export const incomingConfig = parsedConfig.data;

export const managers: Record<string, MediaManager> = {};

for (const arr of incomingConfig.arrs) {
  if (arr.type === "sonarr") {
    managers[arr.id] = new SonarrManager(
      createSonarrClient({
        baseUrl: arr.apiUrl,
        headers: {
          "X-Api-Key": arr.apiKey,
        },
      }),
      arr.id,
    );
  }
  if (arr.type === "radarr") {
    managers[arr.id] = new RadarrManager(
      createRadarrClient({
        baseUrl: arr.apiUrl,
        headers: {
          "X-Api-Key": arr.apiKey,
        },
      }),
      arr.id,
    );
  }
}
