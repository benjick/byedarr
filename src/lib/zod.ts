import { validate } from "node-cron";
import { z } from "zod";

import { MediaManager } from "../config";
import { getFutureDate } from "./date";

export const periodString = z.string().refine(
  (period) => {
    try {
      getFutureDate(period);
      return true;
    } catch (e) {
      return false;
    }
  },
  {
    message:
      "Invalid voting period, should be a string like '1 week' or '2 days'",
  },
);

export const cronString = z.string().refine(
  (cron) => {
    return validate(cron);
  },
  {
    message: "Invalid cron schedule",
  },
);

export const validateUniqueIds = (arrs: MediaManager[]) => {
  const ids = arrs.map((arr) => arr.id);
  return ids.length === new Set(ids).size;
};
