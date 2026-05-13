import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="min-h-screen bg-surface-950 px-6 py-16 text-surface-50">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12">
          <p className="text-sm font-medium text-brand-400">StudioOS</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight">
            Project control room for engineer-led client work.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-surface-400">
            Choose admin operations or client portal. Same Clerk auth, separate
            dashboards.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href={userId ? "/admin" : "/sign-in?redirect_url=/admin"}
            className="rounded-xl border border-surface-800 bg-surface-900 p-6 transition-colors hover:border-brand-500/50"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-surface-500">
              Admin
            </p>
            <h2 className="mt-3 text-2xl font-semibold">Admin Portal</h2>
            <p className="mt-2 text-sm leading-6 text-surface-400">
              Create projects, write proposals, track payments, view assets.
            </p>
          </Link>

          <Link
            href={userId ? "/client" : "/sign-in?redirect_url=/client"}
            className="rounded-xl border border-surface-800 bg-surface-900 p-6 transition-colors hover:border-brand-500/50"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-surface-500">
              Client
            </p>
            <h2 className="mt-3 text-2xl font-semibold">Client Portal</h2>
            <p className="mt-2 text-sm leading-6 text-surface-400">
              Review proposals, pay invoices, upload files, download handoff.
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}
