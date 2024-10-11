import { desc } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { boolean, envSchema } from "./envSchema";

describe("boolean", () => {
  it("should parse strings properly", () => {
    expect(boolean.parse("true")).toBe(true);
    expect(boolean.parse("false")).toBe(false);
    expect(boolean.parse("")).toBe(false);
    expect(boolean.parse("anything")).toBe(false);
    expect(boolean.parse(1)).toBe(true);
    expect(boolean.parse(0)).toBe(false);
    expect(boolean.parse(null)).toBe(false);
    expect(boolean.parse(undefined)).toBe(false);
    expect(boolean.parse(true)).toBe(true);
    expect(boolean.parse(false)).toBe(false);
  });
});

describe("envSchema", () => {
  it("should have defaults properly set", () => {
    const res = envSchema.parse({
      DISCORD_BOT_TOKEN: "process.env.DISCORD_BOT_TOKEN",
      CONFIG_PATH: "process.env.CONFIG_PATH",
      DATABASE_URL: "postgresql://postgres:postgres@db:5432/postgres",
    });
    expect(res.NODE_ENV).toBe("development");
    expect(res.DRY_RUN).toBe(false);
    expect(res.DEBUG).toBe(false);
    expect(res.SKIP_MIGRATIONS).toBe(false);
  });
});
