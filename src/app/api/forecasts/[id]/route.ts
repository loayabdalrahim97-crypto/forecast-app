import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const forecast = await prisma.forecast.findUnique({
    where: { id: params.id },
    include: { variables: true, scenarios: true, outcomeRecord: true },
  });

  if (!forecast) {
    return NextResponse.json({ error: "Forecast not found" }, { status: 404 });
  }

  return NextResponse.json({ forecast }, { status: 200 });
}
