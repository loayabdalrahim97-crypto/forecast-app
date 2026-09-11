import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { checkCurrentUserAdmin } from "@/lib/admin/check-admin";

const RoleSchema = z.object({ role: z.enum(["user", "admin"]) });

/**
 * GET /api/admin/users/:id — user detail + forecast history for the
 * admin Users page. Never returns passwordHash.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const { isAdmin } = await checkCurrentUserAdmin(userId);
  if (!isAdmin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      forecasts: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, situationText: true, createdAt: true, category: true },
      },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ user }, { status: 200 });
}

/**
 * PATCH /api/admin/users/:id — change a user's role. Admin-only (same
 * gate as everything else here — "only an Admin can change roles" is
 * this same check, not a separate one). Logged to AdminActivityLog.
 * An admin can't demote their own account through this endpoint — that
 * would risk locking every admin out at once with no recovery path
 * short of a direct database edit.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const actorId = (session?.user as { id?: string } | undefined)?.id;
  const { isAdmin } = await checkCurrentUserAdmin(actorId);
  if (!isAdmin || !actorId) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  if (params.id === actorId) {
    return NextResponse.json({ error: "You can't change your own role here." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true, role: true } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { role: parsed.data.role },
    select: { id: true, email: true, role: true },
  });

  await prisma.adminActivityLog.create({
    data: {
      actorUserId: actorId,
      action: "role_change",
      targetUserId: params.id,
      detail: `${target.role} -> ${parsed.data.role}`,
    },
  });

  return NextResponse.json({ user: updated }, { status: 200 });
}
