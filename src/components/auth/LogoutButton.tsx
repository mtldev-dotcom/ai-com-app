"use client";

/**
 * Logout button component
 * Uses useUser hook and Supabase client to sign out
 */
import { useUser } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const { signOut } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
    >
      Sign Out
    </button>
  );
}
