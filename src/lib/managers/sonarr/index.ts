import createClient, { type ClientOptions } from "openapi-fetch";

import { MediaItemInsertSchema, MediaManagerAbstract } from "../../types";
import type { paths as Sonarr, components } from "./generated";

export function createSonarrClient(clientOptions?: ClientOptions) {
  return createClient<Sonarr>(clientOptions);
}

export type { Sonarr };

export type SonarrClient = ReturnType<typeof createSonarrClient>;

export class SonarrManager extends MediaManagerAbstract {
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
  }

  async getAll(): Promise<MediaItemInsertSchema[]> {
    const res = await this.client.GET("/api/v3/series");
    return (res.data ?? []).map((item) => this.convertToMediaItem(item));
  }

  async delete(id: number, addImportExclusion: boolean): Promise<void> {
    await this.client.DELETE("/api/v3/series/{id}", {
      params: {
        path: {
          id,
        },
        query: {
          addImportListExclusion: addImportExclusion,
        },
      },
    });
  }

  private convertToMediaItem(
    item: components["schemas"]["SeriesResource"],
  ): MediaItemInsertSchema {
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
      rating: item.ratings?.value ?? undefined,
      pathOnDisk: item.path,
      hasFile: item.statistics?.sizeOnDisk
        ? item.statistics.sizeOnDisk > 0
        : false,
      image: item.images?.[0]?.remoteUrl,
    };
  }
}
