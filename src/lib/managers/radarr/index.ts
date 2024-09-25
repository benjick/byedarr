import createClient, { type ClientOptions } from "openapi-fetch";

import { MediaItemInsertSchema, MediaManagerAbstract } from "../../types";
import type { paths as Radarr, components } from "./generated";

export function createRadarrClient(clientOptions?: ClientOptions) {
  return createClient<Radarr>(clientOptions);
}

export type { Radarr };

export type RadarrClient = ReturnType<typeof createRadarrClient>;

export class RadarrManager extends MediaManagerAbstract {
  constructor(
    private client: RadarrClient,
    private id: string,
  ) {
    super();
  }

  async test(): Promise<void> {
    const res = await this.client.GET("/api");
  }

  async getAll(): Promise<MediaItemInsertSchema[]> {
    const res = await this.client.GET("/api/v3/movie");
    return (res.data ?? []).map((item) => this.convertToMediaItem(item));
  }

  async delete(id: number, addImportExclusion: boolean): Promise<void> {
    await this.client.DELETE("/api/v3/movie/{id}", {
      params: {
        path: {
          id,
        },
        query: {
          addImportExclusion,
        },
      },
    });
  }

  private convertToMediaItem(
    item: components["schemas"]["MovieResource"],
  ): MediaItemInsertSchema {
    if (!item.id) {
      throw new Error("Missing id, can this happen?");
    }
    const imdbRating = item.ratings?.imdb?.value;
    const tmdbRating = item.ratings?.tmdb?.value;
    const rating =
      imdbRating && tmdbRating
        ? (imdbRating + tmdbRating) / 2
        : imdbRating || tmdbRating || undefined;

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
      rating,
      pathOnDisk: item.path,
      image: item.images?.[0]?.remoteUrl,
    };
  }
}
