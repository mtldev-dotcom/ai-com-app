"use client";

/**
 * Topbar Component
 * Top navigation bar with theme toggle and user menu
 */
import { useUser } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { MobileSidebar } from "./mobile-sidebar";

export function Topbar() {
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <MobileSidebar />
      <div className="flex flex-1 items-center justify-end gap-4">
        <ThemeToggle />
        {user && (
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-muted-foreground sm:inline-block">
              {user.email}
            </span>
            <LogoutButton />
          </div>
        )}
      </div>
    </header>
  );
}
