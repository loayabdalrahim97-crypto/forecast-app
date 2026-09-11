import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { checkCurrentUserAdmin } from "@/lib/admin/check-admin";

/** GET /api/admin/activity — recent admin actions (role changes, etc). */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const { isAdmin } = await checkCurrentUserAdmin(userId);
  if (!isAdmin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const entries = await prisma.adminActivityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ entries }, { status: 200 });
}
