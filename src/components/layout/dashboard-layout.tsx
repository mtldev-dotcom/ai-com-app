/**
 * Dashboard Layout Component
 * Wraps protected pages with sidebar and topbar
 */
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
