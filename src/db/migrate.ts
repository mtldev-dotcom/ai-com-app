/**
 * Migration Runner
 * Executes migration SQL files against the database
 */

import { db } from "./index";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

async function runMigration(filePath: string) {
  console.log(`Running migration: ${filePath}`);
  
  const migrationSQL = fs.readFileSync(filePath, "utf-8");
  
  // Split by statement-breakpoint
  const statements = migrationSQL
    .split(/--> statement-breakpoint/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await db.execute(sql.raw(statement));
        console.log(`✓ Executed: ${statement.substring(0, 50)}...`);
      } catch (error) {
        // Ignore "already exists" errors for columns/indexes
        if (
          error instanceof Error &&
          (error.message.includes("already exists") ||
            error.message.includes("duplicate") ||
            (error.message.includes("column") && error.message.includes("already")))
        ) {
          console.log(`⊘ Skipped (already exists): ${statement.substring(0, 50)}...`);
        } else {
          console.error(`✗ Error executing statement:`, error);
          throw error;
        }
      }
    }
  }
  
  console.log(`✓ Migration completed: ${path.basename(filePath)}`);
}

async function main() {
  try {
    // Get migration files directory
    const migrationsDir = path.resolve(
      process.cwd(),
      "src/db/migrations"
    );
    
    // Get all migration files sorted by name
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort()
      .map((file) => path.join(migrationsDir, file));

    if (migrationFiles.length === 0) {
      console.error(`No migration files found in ${migrationsDir}`);
      process.exit(1);
    }

    console.log(`Found ${migrationFiles.length} migration file(s)\n`);

    // Run each migration in sequence
    for (const migrationFile of migrationFiles) {
      await runMigration(migrationFile);
      console.log(""); // Empty line between migrations
    }

    console.log("\n✓ All migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n✗ Migration failed:", error);
    process.exit(1);
  }
}

main();

