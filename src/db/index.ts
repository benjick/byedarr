import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { Client, Pool } from "pg";

import * as mediaSchema from "./schema/media";

const connectionString =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/postgres";

let clientInstance: Pool | null = null;

function getClient() {
  if (clientInstance) {
    return clientInstance;
  }
  clientInstance = new Pool({
    connectionString,
    max: 100,
  });
  return clientInstance;
}

export const client = getClient();

export const db = drizzle(client, {
  schema: {
    ...mediaSchema,
  },
});

async function main() {
  if (process.env.NODE_ENV === "production") {
    // Run migrations when deployed
    if (process.env.SKIP_MIGRATIONS) {
      return;
    }
    const client = new Pool({
      connectionString,
      max: 1,
    });
    const db = drizzle(client);
    console.log("Running migrations...");
    await migrate(db, { migrationsFolder: "./src/server/db/migrations" });
    await client.end();
    console.log("Migrations complete!");
  }
}

void main();
