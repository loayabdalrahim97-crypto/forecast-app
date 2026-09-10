import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { SignupSchema } from "@/lib/auth/signup-schema";

/**
 * POST /api/auth/signup
 * Body: { email, password, name? }
 *
 * Plain credentials signup feeding the NextAuth Credentials provider
 * already scaffolded in Phase 1 (src/lib/auth/config.ts). OAuth
 * providers can be added later without touching this.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = SignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  const user = await prisma.user.create({
    data: {
      email: parsed.data.email,
      passwordHash,
      name: parsed.data.name,
    },
    select: { id: true, email: true, name: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}
