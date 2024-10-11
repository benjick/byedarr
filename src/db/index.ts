import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

import { env } from "../env";
import * as mediaSchema from "./schema/media";
import * as subscriberSchema from "./schema/subscribers";
import * as votingSchema from "./schema/voting";

const client = postgres(env.DATABASE_URL);

export const db = drizzle(client, {
  schema: {
    ...mediaSchema,
    ...subscriberSchema,
    ...votingSchema,
  },
});

export async function runMigrations() {
  if (env.NODE_ENV === "production") {
    if (env.SKIP_MIGRATIONS) {
      console.log("🙈 Skipping migrations");
      return;
    }
    const migrationClient = postgres(env.DATABASE_URL);
    const db = drizzle(migrationClient);
    console.log("🔨 Running migrations...");
    await migrate(db, { migrationsFolder: "./src/db/migrations" });
    await migrationClient.end();
    console.log("✅ Migrations complete!");
  } else {
    console.log(
      "🏃 Skipping migrations in dev mode - run manually with 'pnpm db:push'",
    );
  }
}
