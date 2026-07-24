import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth/server";
import { isAdminUserId } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminIndexPage() {
  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;

  if (!isAdminUserId(userId)) {
    notFound();
  }

  return (
    <div className="min-h-full px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <header className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
          <h1 className="text-xl font-bold text-slate-100">Admin</h1>
          <p className="mt-1 text-sm text-slate-300">Internal tools for maintenance and repair jobs.</p>
        </header>

        <Link
          href="/admin/catalog-refresh"
          className="block rounded-xl border border-slate-700 bg-slate-800/60 p-4 transition-colors hover:border-blue-500/50 hover:bg-slate-800"
        >
          <p className="text-base font-semibold text-slate-100">Catalog Refresh</p>
          <p className="mt-1 text-sm text-slate-300">Refresh all shows from TMDB, including show names.</p>
        </Link>
      </div>
    </div>
  );
}
