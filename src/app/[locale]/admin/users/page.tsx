import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { checkCurrentUserAdmin } from "@/lib/admin/check-admin";
import { UsersClient } from "./users-client";

export default async function AdminUsersPage({ params }: { params: { locale: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const { isAdmin } = await checkCurrentUserAdmin(userId);

  if (!isAdmin) {
    notFound();
  }

  return <UsersClient locale={params.locale} />;
}
