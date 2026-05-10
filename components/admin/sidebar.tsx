"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrganizationSwitcher } from "@clerk/nextjs";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "◈" },
  { href: "/admin/projects", label: "Projects", icon: "◇" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-surface-800 bg-surface-900">
      {/* Brand */}
      <div className="flex h-16 items-center border-b border-surface-800 px-6">
        <Link
          href="/admin"
          className="text-lg font-semibold tracking-tight text-surface-50"
        >
          Studio<span className="text-brand-500">OS</span>
        </Link>
      </div>

      {/* Org Switcher */}
      <div className="border-b border-surface-800 p-4">
        <OrganizationSwitcher
          appearance={{
            elements: {
              rootBox: "w-full",
              organizationSwitcherTrigger:
                "w-full justify-between rounded-lg border border-surface-700 bg-surface-850 px-3 py-2 text-sm text-surface-200 hover:bg-surface-800",
            },
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-600/10 text-brand-400"
                  : "text-surface-400 hover:bg-surface-800 hover:text-surface-200"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-surface-800 p-4">
        <p className="text-xs text-surface-500">Studio OS v0.1.0</p>
      </div>
    </aside>
  );
}
