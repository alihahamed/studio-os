import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-950 text-surface-50">
      <aside className="hidden w-64 border-r border-surface-800 bg-surface-900 md:flex md:flex-col">
        <div className="flex h-16 items-center border-b border-surface-800 px-6">
          <Link href="/client" className="text-lg font-semibold">
            Studio<span className="text-brand-500">OS</span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          <Link
            href="/client"
            className="block rounded-lg px-3 py-2.5 text-sm text-surface-300 hover:bg-surface-800"
          >
            Dashboard
          </Link>
          <Link
            href="/client/projects"
            className="block rounded-lg px-3 py-2.5 text-sm text-surface-300 hover:bg-surface-800"
          >
            Projects
          </Link>
          <Link
            href="/admin"
            className="block rounded-lg px-3 py-2.5 text-sm text-surface-500 hover:bg-surface-800 hover:text-surface-300"
          >
            Admin Portal
          </Link>
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-surface-800 bg-surface-900 px-6">
          <div>
            <p className="text-sm font-medium text-surface-400">
              Client Portal
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/client/projects"
              className="text-sm text-surface-400 hover:text-surface-100 md:hidden"
            >
              Projects
            </Link>
            <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
