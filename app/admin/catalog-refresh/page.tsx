import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth/server";
import { isAdminUserId } from "@/lib/auth/admin";
import AdminCatalogRefreshPage from "@/components/pages/AdminCatalogRefreshPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Catalog Refresh",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminCatalogRefreshRoute() {
  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;

  if (!isAdminUserId(userId)) {
    notFound();
  }

  return <AdminCatalogRefreshPage />;
}
