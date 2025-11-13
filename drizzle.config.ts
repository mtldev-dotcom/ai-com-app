import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export default {
  schema: "./src/db/schema/*",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
} satisfies Config;
