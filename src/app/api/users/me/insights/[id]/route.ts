import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";

const PatchSchema = z.object({
  confirmedByUser: z.boolean(),
});

/**
 * PATCH /api/users/me/insights/:id — §19: "allow users to inspect and
 * correct learned patterns." confirmedByUser: true confirms the
 * pattern rings true; false marks it as incorrect (kept, not deleted,
 * so the system doesn't just re-learn the same wrong pattern next run
 * without knowing it was already rejected).
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const insight = await prisma.userInsight.findUnique({ where: { id: params.id } });
  if (!insight || insight.userId !== userId) {
    return NextResponse.json({ error: "Insight not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const updated = await prisma.userInsight.update({
    where: { id: params.id },
    data: { confirmedByUser: parsed.data.confirmedByUser },
  });

  return NextResponse.json({ insight: updated }, { status: 200 });
}

/**
 * DELETE /api/users/me/insights/:id — remove a learned pattern the
 * user doesn't want tracked at all.
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const insight = await prisma.userInsight.findUnique({ where: { id: params.id } });
  if (!insight || insight.userId !== userId) {
    return NextResponse.json({ error: "Insight not found" }, { status: 404 });
  }

  await prisma.userInsight.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true }, { status: 200 });
}
