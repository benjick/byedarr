import * as fs from "fs";
import * as yaml from "js-yaml";

import { Config, ConfigSchema } from ".";
import { env } from "../env";
import { RadarrManager, createRadarrClient } from "../lib/managers/radarr";
import { SonarrManager, createSonarrClient } from "../lib/managers/sonarr";
import { MediaManagerAbstract } from "../lib/types";

export function loadConfig() {
  const configPath = env.CONFIG_PATH;
  console.log("Config path:", configPath);
  const rawConfig = yaml.load(fs.readFileSync(configPath, "utf8"));
  const parsedConfig = ConfigSchema.safeParse(rawConfig);

  if (!parsedConfig.success) {
    console.error("Invalid config:", parsedConfig.error.message);
    process.exit(1);
  }

  const config = parsedConfig.data;
  return config;
}

export function loadManagers(config: Config) {
  const managers: Record<string, MediaManagerAbstract> = {};

  for (const arr of config.mediaManagers) {
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

  return managers;
}
