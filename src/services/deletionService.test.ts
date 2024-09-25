import { describe, expect, it } from "vitest";

import { MediaItemInsertSchema } from "../lib/types";
import { calculateDeletionScore } from "./deletionService";

describe("calculateDeletionScore", () => {
  it("should calculate the correct score", () => {
    const mockItem: MediaItemInsertSchema = {
      id: "radarr-500",
      managerId: 1,
      managerType: "radarr",
      managerConfigId: "radarr",
      title: "Canceled",
      releaseDate: new Date("2023-01-01"),
      addedToManager: new Date("2023-01-01"),
      sizeOnDisk: "3597166298", // 3.6GB
      rating: 4.8,
      hasFile: true,
      pathOnDisk: "/movies/Canceled (2023)",
    };

    const score = calculateDeletionScore(mockItem, {
      age: 0.1,
      size: 0.3,
      rating: 1,
    });
    expect(score).toBeGreaterThan(0);
    expect(Math.round(score)).toBe(64);
  });
});
