import createClient, { type ClientOptions } from "openapi-fetch";

import { MediaItem, MediaManager } from "../types";
import type { paths as Radarr, components } from "./generated";

export function createRadarrClient(clientOptions?: ClientOptions) {
  return createClient<Radarr>(clientOptions);
}

export type { Radarr };

export type RadarrClient = ReturnType<typeof createRadarrClient>;

export class RadarrManager extends MediaManager {
  private client: RadarrClient;

  constructor(
    client: RadarrClient,
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
    const res = await this.client.GET("/api/v3/movie");
    return (res.data ?? []).map((item) => this.convertToMediaItem(item));
  }

  private convertToMediaItem(
    item: components["schemas"]["MovieResource"],
  ): MediaItem {
    if (!item.id) {
      throw new Error("Missing id, can this happen?");
    }
    return {
      id: `${this.id}-${item.id}`,
      managerId: item.id,
      managerType: "radarr",
      managerConfigId: this.id,
      title: item.title ?? "",
      releaseDate: item.digitalRelease
        ? new Date(item.digitalRelease)
        : new Date(),
      sizeOnDisk: item.sizeOnDisk ? item.sizeOnDisk.toString() : "0",
      addedToManager: item.added ? new Date(item.added) : new Date(),
      year: item.year ?? undefined,
      hasFile: item.hasFile ?? false,
      imdbId: item.imdbId ?? undefined,
      tmdbId: item.tmdbId ?? undefined,
      imdbRating: item.ratings?.imdb?.value ?? undefined,
      tmdbRating: item.ratings?.tmdb?.value ?? undefined,
      pathOnDisk: item.path,
    };
  }
}
