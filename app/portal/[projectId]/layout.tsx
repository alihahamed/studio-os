import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { userId } = await auth();
  const { projectId } = await params;
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Minimal dark header */}
      <header className="border-b border-surface-800/50 bg-surface-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <div className="flex items-center">
            <Link
              href="/client"
              className="text-sm font-semibold tracking-tight text-surface-50"
            >
            Studio<span className="text-brand-500">OS</span>
            </Link>
            <span className="mx-3 text-surface-700">|</span>
            <span className="text-xs text-surface-500">Client Portal</span>
          </div>
          <nav className="flex items-center gap-3 text-xs">
            <Link
              href={`/client/projects/${projectId}`}
              className="text-surface-400 hover:text-surface-100"
            >
              Back
            </Link>
            <Link href="/client" className="text-surface-500 hover:text-surface-200">
              Dashboard
            </Link>
            <Link href="/admin" className="text-surface-500 hover:text-surface-200">
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
    </div>
  );
}
