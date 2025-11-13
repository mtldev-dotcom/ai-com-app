"use client";

/**
 * Sidebar Component
 * Navigation sidebar with route links and active state
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Package,
  Upload,
  Users,
  BarChart3,
  Settings,
  Key,
  Search,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Imports", href: "/imports", icon: Upload },
  { name: "Product Matcher", href: "/product-matcher", icon: Sparkles },
  { name: "Suppliers", href: "/suppliers", icon: Users },
  { name: "Research", href: "/research", icon: Search },
  { name: "Tokens", href: "/tokens", icon: Key },
  { name: "Monitoring", href: "/monitoring", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-lg font-semibold">AI E-Commerce</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
