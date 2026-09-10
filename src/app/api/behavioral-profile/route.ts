import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { SubmitAnswersSchema } from "@/lib/behavioral-profile/schema";
import { buildProfileFromAnswers, InvalidAnswerError } from "@/lib/behavioral-profile/build-profile";

/**
 * POST /api/behavioral-profile
 * Body: { answers: [{ questionId, value }, ...] }
 *
 * §10: answers can arrive incrementally (the client re-posts the full
 * answer set so far, or just the new ones — either way this upserts).
 * We store both the structured profile (fast to read) and the raw
 * answers (BehavioralAnswer rows — §24), so the user can later see
 * exactly what they answered, per §19's "allow users to inspect and
 * correct learned patterns."
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = SubmitAnswersSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  let structuredUpdate;
  try {
    structuredUpdate = buildProfileFromAnswers(parsed.data.answers);
  } catch (err) {
    if (err instanceof InvalidAnswerError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const profile = await prisma.behavioralProfile.upsert({
    where: { userId },
    create: { userId, ...structuredUpdate },
    update: structuredUpdate,
  });

  await prisma.behavioralAnswer.createMany({
    data: parsed.data.answers.map((a) => ({
      profileId: profile.id,
      questionKey: a.questionId,
      answerValue: a.value,
    })),
  });

  return NextResponse.json({ profile }, { status: 200 });
}

/**
 * GET /api/behavioral-profile
 * Returns the signed-in user's current profile, or null if they haven't
 * completed onboarding yet. Used by both the onboarding flow (to figure
 * out what's left to ask, §12) and a future "edit your profile" screen.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;

  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const profile = await prisma.behavioralProfile.findUnique({
    where: { userId },
    include: { answers: true },
  });

  return NextResponse.json({ profile }, { status: 200 });
}
