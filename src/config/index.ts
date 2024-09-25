import { z } from "zod";

import { cronString, periodString, validateUniqueIds } from "../lib/zod";
import { loadConfig, loadManagers } from "./utils";

const WeightsSchema = z
  .object({
    age: z
      .number()
      .min(0)
      .default(0.1)
      .describe("Since added to the media manager"),
    size: z.number().min(0).default(0.3),
    rating: z.number().min(0).default(1),
  })
  .default({})
  .describe("Weights for each media attribute");

const MediaManagerSchema = z.object({
  id: z
    .string()
    .min(1)
    .describe(
      "Unique identifier for the media manager, can be anything, don't change it later",
    ),
  enabled: z
    .boolean()
    .default(true)
    .describe("Should look for media in this manager"),
  apiUrl: z
    .string()
    .url()
    .describe(
      "Base URL for the media manager's API, excluding the '/api' endpoint.",
    ),
  apiKey: z.string().min(1),
  type: z
    .enum(["radarr", "sonarr"])
    .describe("Specifies the media manager software being used."),
  count: z
    .number()
    .int()
    .min(1)
    .default(1)
    .describe("Number of media items to include in each voting round."),
  weights: WeightsSchema,
  addImportExclusionOnDelete: z
    .boolean()
    .default(false)
    .describe(
      "If true, adds deleted items to the import exclusion list to prevent re-addition.",
    ),
});

const Discord = z.object({
  channelId: z
    .string()
    .min(1)
    .describe("ID of the channel to send messages to"),
});

export const ConfigSchema = z.object({
  cron: z
    .object({
      findMedia: cronString
        .default("0 18 * * *")
        .describe("How often to check for media to remove"),
      processVotes: cronString
        .default("0 * * * *")
        .describe(
          "How often to check for ended votes and remove media if necessary",
        ),
    })
    .default({}),
  mediaManagers: z
    .array(MediaManagerSchema)
    .refine(validateUniqueIds, {
      message: "Duplicate IDs found",
    })
    .describe("List of media managers to use"),
  ignoredPaths: z.array(z.string()).default([]).describe("Paths to ignore"),
  discord: Discord.describe("Discord settings"),
  votingPeriod: periodString
    .default("1 week")
    .describe("How long a vote lasts"),
  gracePeriod: periodString
    .default("2 weeks")
    .describe(
      "How long to wait after a vote ends before removing/whitelisting media",
    ),
  immunityPeriod: periodString
    .default("3 months")
    .describe(
      "How long after a media item has been added to a manager it is immune from voting",
    ),
  onDraw: z
    .enum(["keep", "delete"])
    .default("delete")
    .describe("What to do if a vote ends in a draw"),
  dryRun: z
    .boolean()
    .default(false)
    .describe("If true, no media will actually be deleted"),
});

export type MediaManager = z.infer<typeof MediaManagerSchema>;
export type Config = z.infer<typeof ConfigSchema>;
export type Weights = z.infer<typeof WeightsSchema>;

export const config = loadConfig();
export const managers = loadManagers(config);
