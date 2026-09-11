import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";

const VALID_DECISION_AREAS = ["career", "relationships", "finance", "business", "personal", "other"];

const UpdateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  preferredLanguage: z.string().min(2).max(10).optional(),
  timezone: z.string().min(1).max(60).nullable().optional(),
  occupation: z.string().max(120).nullable().optional(),
  decisionAreas: z.array(z.enum(VALID_DECISION_AREAS as [string, ...string[]])).max(6).optional(),
});

/**
 * GET/PATCH /api/profile — the signed-in user's own lightweight
 * profile only. No admin bypass, no lookup by id: always the session
 * user (§16 privacy — users can only access their own data).
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      profileImage: true,
      preferredLanguage: true,
      timezone: true,
      occupation: true,
      decisionAreas: true,
      createdAt: true,
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ profile: user }, { status: 200 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = UpdateProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
    select: {
      email: true,
      name: true,
      profileImage: true,
      preferredLanguage: true,
      timezone: true,
      occupation: true,
      decisionAreas: true,
    },
  });

  return NextResponse.json({ profile: user }, { status: 200 });
}

/**
 * DELETE /api/profile — §10/§16 (Settings > Privacy > Delete account).
 * Soft delete only (the `deletedAt` column already exists for exactly
 * this) — decision history and other records stay intact for now
 * rather than a hard cascade delete, which is safer as a first pass
 * and easy to upgrade to a real purge job later without an API change.
 */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date() } });
  return NextResponse.json({ deleted: true }, { status: 200 });
}
