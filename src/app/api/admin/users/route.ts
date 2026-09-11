import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { checkCurrentUserAdmin } from "@/lib/admin/check-admin";

const PAGE_SIZE = 25;

/**
 * GET /api/admin/users?q=&page=1
 *
 * Never returns passwordHash or any other secret — select is explicit,
 * not a bare findMany that could accidentally leak a new sensitive
 * column added later.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const { isAdmin } = await checkCurrentUserAdmin(userId);
  if (!isAdmin) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const where = q
    ? { OR: [{ email: { contains: q, mode: "insensitive" as const } }, { name: { contains: q, mode: "insensitive" as const } }] }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { forecasts: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json(
    { users, total, page, pageSize: PAGE_SIZE, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) },
    { status: 200 }
  );
}
