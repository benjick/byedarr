import createClient, { type ClientOptions } from "openapi-fetch";

import { MediaItem, MediaManager } from "../types";
import type { paths as Sonarr, components } from "./generated";

export function createSonarrClient(clientOptions?: ClientOptions) {
  return createClient<Sonarr>(clientOptions);
}

export type { Sonarr };

export type SonarrClient = ReturnType<typeof createSonarrClient>;

export class SonarrManager extends MediaManager {
  private client: SonarrClient;

  constructor(
    client: SonarrClient,
    private id: string,
  ) {
    super();
    this.client = client;
  }

  async test(): Promise<void> {
    const res = await this.client.GET("/api");
    console.log(res.data);
  }

  async getAll(): Promise<MediaItem[]> {
    const res = await this.client.GET("/api/v3/series");
    return (res.data ?? []).map((item) => this.convertToMediaItem(item));
  }

  private convertToMediaItem(
    item: components["schemas"]["SeriesResource"],
  ): MediaItem {
    if (!item.id) {
      throw new Error("Missing id, can this happen?");
    }
    return {
      id: `${this.id}-${item.id}`,
      managerId: item.id,
      managerType: "sonarr",
      managerConfigId: this.id,
      title: item.title ?? "",
      releaseDate: item.added ? new Date(item.added) : new Date(),
      sizeOnDisk: item.statistics?.sizeOnDisk
        ? item.statistics.sizeOnDisk.toString()
        : "0",
      addedToManager: item.added ? new Date(item.added) : new Date(),
      year: item.year ?? undefined,
      imdbId: item.imdbId ?? undefined,
      tmdbId: item.tmdbId ?? undefined,
      // TODO: Unify these?
      imdbRating: item.ratings?.value ?? undefined,
      tmdbRating: item.ratings?.value ?? undefined,
      pathOnDisk: item.path,
      hasFile: item.statistics?.sizeOnDisk
        ? item.statistics.sizeOnDisk > 0
        : false,
    };
  }
}
