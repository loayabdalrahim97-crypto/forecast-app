import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const BodySchema = z.object({
  interval: z.enum(["24h", "3d", "1w"]).nullable(),
});

/**
 * POST /api/forecasts/:id/reminder
 *
 * Saves the person's chosen reminder interval on the forecast. Honest
 * limitation: this only stores the preference — there is no email or
 * push notification service wired up yet to actually deliver a
 * reminder at that interval. Wiring that up is a separate piece of
 * infrastructure (an email provider + a scheduled job), not built here.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const forecast = await prisma.forecast.findUnique({ where: { id: params.id } });
  if (!forecast) {
    return NextResponse.json({ error: "Forecast not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  await prisma.forecast.update({
    where: { id: forecast.id },
    data: { reminderInterval: parsed.data.interval },
  });

  return NextResponse.json({ saved: true }, { status: 200 });
}
