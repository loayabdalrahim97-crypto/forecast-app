import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { computeDecisionProfile } from "@/lib/decision-profile/compute-decision-profile";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const profile = await computeDecisionProfile(userId);
  return NextResponse.json({ profile }, { status: 200 });
}
