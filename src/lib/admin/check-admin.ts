import { prisma } from "@/lib/db";
import { isAdminEmail } from "./is-admin";

/**
 * The actual authorization decision for every admin page and API
 * route. ADMIN_EMAILS (isAdminEmail) is no longer checked directly at
 * request time — it's a one-time bootstrap: if a signed-in user's
 * email is on that list and their DB role isn't "admin" yet, this
 * syncs it once. After that, the database `role` column is the sole
 * source of truth, so admin status can be granted/revoked through the
 * Users management page without touching environment variables or
 * redeploying.
 *
 * Deliberately fails CLOSED: any error, missing session, or missing
 * user resolves to isAdmin: false.
 */
export async function checkCurrentUserAdmin(userId: string | null | undefined): Promise<{
  isAdmin: boolean;
  userId: string | null;
}> {
  if (!userId) return { isAdmin: false, userId: null };

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, role: true } });
  if (!user) return { isAdmin: false, userId: null };

  if (user.role === "admin") {
    return { isAdmin: true, userId: user.id };
  }

  // Bootstrap sync — only ever promotes, never demotes here (demotion
  // only happens explicitly through the Users management page).
  if (isAdminEmail(user.email)) {
    await prisma.user.update({ where: { id: user.id }, data: { role: "admin" } });
    return { isAdmin: true, userId: user.id };
  }

  return { isAdmin: false, userId: user.id };
}
