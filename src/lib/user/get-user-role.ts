/**
 * User Role Helper
 * Gets user role from database for role-based access control
 */

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

/**
 * Get user role from database
 * Gets the current authenticated user's role
 * @returns User role or 'viewer' as default
 */
export async function getUserRole(): Promise<
  "owner" | "manager" | "editor" | "viewer"
> {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser || !authUser.email) {
      return "viewer";
    }

    // Find user by email (matching Supabase auth email with our users table)
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, authUser.email))
      .limit(1);

    if (user && user.role) {
      return user.role as "owner" | "manager" | "editor" | "viewer";
    }

    // If user doesn't exist in our table, create one with default 'viewer' role
    // This ensures users from Supabase Auth are tracked in our DB
    if (!user) {
      try {
        const [newUser] = await db
          .insert(users)
          .values({
            email: authUser.email,
            name: authUser.user_metadata?.name || authUser.email.split("@")[0],
            role: "viewer",
            locale: "en",
          })
          .returning();

        return (
          (newUser?.role as "owner" | "manager" | "editor" | "viewer") ||
          "viewer"
        );
      } catch (insertError) {
        // If insert fails (e.g., duplicate), try to fetch again
        const [existingUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, authUser.email))
          .limit(1);

        if (existingUser?.role) {
          return existingUser.role as "owner" | "manager" | "editor" | "viewer";
        }
      }
    }

    // Default to viewer if not found
    return "viewer";
  } catch (error) {
    console.error("Error getting user role:", error);
    return "viewer";
  }
}

/**
 * Check if user has required role or higher
 * Role hierarchy: owner > manager > editor > viewer
 */
export function hasRole(
  userRole: "owner" | "manager" | "editor" | "viewer",
  requiredRole: "owner" | "manager" | "editor" | "viewer"
): boolean {
  const roleHierarchy: Record<string, number> = {
    owner: 4,
    manager: 3,
    editor: 2,
    viewer: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Check if current user has owner role
 */
export async function isOwner(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const role = await getUserRole();
  return role === "owner";
}
