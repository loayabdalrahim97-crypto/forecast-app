import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { getUsageStatus } from "@/lib/billing/usage";
import { PLANS } from "@/lib/billing/plans";

/** GET /api/billing/status - §11: everything the Billing page needs, in one call. */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [subscription, usage] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId } }),
    getUsageStatus(userId),
  ]);

  return NextResponse.json(
    {
      plan: usage.plan,
      planName: PLANS[usage.plan as keyof typeof PLANS]?.name ?? "Free",
      usage: {
        used: usage.used,
        limit: usage.limit,
        remaining: usage.remaining,
        periodEnd: usage.periodEnd,
      },
      subscription: subscription
        ? {
            status: subscription.status,
            provider: subscription.provider,
            currentPeriodEnd: subscription.currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          }
        : null,
    },
    { status: 200 }
  );
}
