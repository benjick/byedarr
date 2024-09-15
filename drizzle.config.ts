import { type Config } from "drizzle-kit";

const connectionString =
  process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/postgres";

console.log("connectionString", connectionString);

export default {
  schema: ["./src/db/schema/*.ts"],
  dialect: "postgresql",
  dbCredentials: {
    url: connectionString,
  },
  out: "./src/db/migrations",
} satisfies Config;
