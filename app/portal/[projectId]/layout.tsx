import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-surface-950">
      {/* Minimal dark header */}
      <header className="border-b border-surface-800/50 bg-surface-950/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-4xl items-center px-6">
          <span className="text-sm font-semibold tracking-tight text-surface-50">
            Studio<span className="text-brand-500">OS</span>
          </span>
          <span className="mx-3 text-surface-700">|</span>
          <span className="text-xs text-surface-500">Client Portal</span>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
    </div>
  );
}
