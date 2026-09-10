import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { CreateForecastSchema } from "@/lib/forecast/schema";
import { analyzeSituation, generateFollowUpQuestions } from "@/lib/forecast/analyze-situation";
import { analysisToVariableRows } from "@/lib/forecast/variable-rows";
import { AIValidationError } from "@/lib/ai/orchestrator";

/**
 * POST /api/forecasts
 * Body: { situationText: string }
 *
 * §8: works for both signed-in users and anonymous visitors (Free
 * Forecast) — Forecast.userId is nullable specifically for this. §11:
 * runs the Situation Analyzer and persists facts/assumptions/unknowns/
 * variables as separate rows. §12: only asks follow-up questions when
 * there are unknowns worth asking about.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CreateForecastSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  let analysisResult;
  try {
    analysisResult = await analyzeSituation(parsed.data.situationText);
  } catch (err) {
    if (err instanceof AIValidationError) {
      return NextResponse.json({ error: "Analysis failed validation" }, { status: 502 });
    }
    return NextResponse.json({ error: "Analysis failed" }, { status: 502 });
  }

  const analysis = analysisResult.data;

  const followUp = await generateFollowUpQuestions({
    situationText: parsed.data.situationText,
    unknowns: analysis.unknowns,
  }).catch(() => ({ data: { questions: [] as string[] }, meta: null }));

  const forecast = await prisma.forecast.create({
    data: {
      userId,
      situationText: parsed.data.situationText,
      mode: "general",
      variables: {
        createMany: {
          data: analysisToVariableRows(analysis),
        },
      },
    },
    include: { variables: true },
  });

  return NextResponse.json(
    {
      forecast,
      followUpQuestions: followUp.data.questions,
    },
    { status: 201 }
  );
}

/**
 * GET /api/forecasts/:id is handled in [id]/route.ts — this file only
 * covers creation and (later) listing.
 */
