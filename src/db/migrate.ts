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
    // Get migration file path relative to project root
    const migrationFile = path.resolve(
      process.cwd(),
      "src/db/migrations/0004_clear_nekra.sql"
    );
    
    if (!fs.existsSync(migrationFile)) {
      console.error(`Migration file not found: ${migrationFile}`);
      process.exit(1);
    }

    await runMigration(migrationFile);
    console.log("\n✓ All migrations completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n✗ Migration failed:", error);
    process.exit(1);
  }
}

main();

