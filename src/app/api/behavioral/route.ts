import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      sessionId?: string;
      messageId?: string;
      draftDurationMs?: number;
      responseLatencyMs?: number;
      backspaceCount?: number;
      pastedChars?: number;
      deletedChars?: number;
      finalLength?: number;
      hesitationMs?: number;
      scrolledResponse?: boolean;
      ctaClicked?: boolean;
      ctaLabel?: string;
      returnedAfterCta?: boolean;
      continuedAfterCta?: boolean;
      isAbandonmentPoint?: boolean;
      emotionalState?: string;
    };

    if (!body.sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    // Validate emotional state if provided
    const validStates = ["stressed", "skeptical", "analytical", "rushed", "frustrated", "calm", "exploratory"];
    const emotionalState = body.emotionalState && validStates.includes(body.emotionalState)
      ? body.emotionalState
      : undefined;

    const signal = await prisma.behavioralSignal.create({
      data: {
        sessionId: body.sessionId,
        messageId: body.messageId ?? null,
        draftDurationMs: body.draftDurationMs,
        responseLatencyMs: body.responseLatencyMs,
        backspaceCount: body.backspaceCount,
        pastedChars: body.pastedChars,
        deletedChars: body.deletedChars,
        finalLength: body.finalLength,
        hesitationMs: body.hesitationMs,
        scrolledResponse: body.scrolledResponse ?? false,
        ctaClicked: body.ctaClicked ?? false,
        ctaLabel: body.ctaLabel,
        returnedAfterCta: body.returnedAfterCta ?? false,
        continuedAfterCta: body.continuedAfterCta ?? false,
        isAbandonmentPoint: body.isAbandonmentPoint ?? false,
        emotionalState,
      },
    });

    return NextResponse.json({ signalId: signal.id });
  } catch {
    return NextResponse.json({ error: "Failed to save signal" }, { status: 500 });
  }
}
