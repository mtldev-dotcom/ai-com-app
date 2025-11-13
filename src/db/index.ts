import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import * as schema from "./schema";

// Load environment variables (for server-side usage)
dotenv.config({ path: ".env.local" });

/**
 * Database connection instance
 * Uses connection pooling for better performance
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Disable prefetch as it is not supported for "Transaction" pool mode
// Use connection pooling for better performance
const client = postgres(connectionString, { prepare: false, max: 1 });

export const db = drizzle(client, { schema });

// Export schema for use in queries
export * from "./schema";
