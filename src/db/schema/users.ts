import { pgTable, text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";

/**
 * User role enum
 * Defines access levels: owner, manager, editor, viewer
 */
export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "manager",
  "editor",
  "viewer",
]);

/**
 * Users table
 * Stores user account information
 * Note: This table works alongside Supabase Auth (auth.users)
 * The id here can reference auth.users.id when auth is implemented
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: userRoleEnum("role").default("viewer"), // Default role is viewer (most restrictive)
  locale: text("locale").default("en"), // User's preferred locale (en/fr)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
