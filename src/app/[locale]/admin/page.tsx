import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkCurrentUserAdmin } from "@/lib/admin/check-admin";
import { AdminDashboardClient } from "./admin-dashboard-client";

/**
 * Server component — the real gate. A normal user hitting /admin gets
 * an actual Next.js 404 (via notFound()), not an "unauthorized" page:
 * nothing here confirms that a Management area exists at all. The
 * client component below only renders once this check has already
 * passed server-side.
 */
export default async function AdminPage({ params }: { params: { locale: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const { isAdmin } = await checkCurrentUserAdmin(userId);

  if (!isAdmin) {
    notFound();
  }

  return <AdminDashboardClient locale={params.locale} />;
}
