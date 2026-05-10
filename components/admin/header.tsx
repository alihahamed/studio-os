"use client";

import { UserButton } from "@clerk/nextjs";

export function AdminHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-800 bg-surface-900 px-6">
      <div>
        <h2 className="text-sm font-medium text-surface-400">Admin Panel</h2>
      </div>
      <div className="flex items-center gap-4">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-8 w-8",
            },
          }}
        />
      </div>
    </header>
  );
}
