import { parseCronExpression } from "cron-schedule";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { describe, expect, it } from "vitest";

dayjs.extend(relativeTime);

describe("next vote", () => {
  it("should calculate the correct time until the next vote", () => {
    const cron = parseCronExpression("30 * * * *");
    const nextVote = cron.getNextDate(new Date("2024-10-11T12:00:00Z"));
    const timeLeft = dayjs(nextVote).fromNow();
    expect(timeLeft).toBe("in 5 hours");
  });
});
