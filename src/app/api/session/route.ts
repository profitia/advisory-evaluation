import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      locale?: string;
      testerNote?: string;
      userSwitchedLocale?: boolean;
    };

    const locale = (body.locale === "en" ? "en" : "pl") as "pl" | "en";
    const userAgent = req.headers.get("user-agent") ?? undefined;

    const session = await prisma.evaluationSession.create({
      data: {
        sessionLocale: locale,
        assistantLanguage: locale,
        feedbackLanguage: "pl", // always Polish — evaluators are PL-speaking
        userSwitchedLocale: body.userSwitchedLocale ?? false,
        switchTimestamp: body.userSwitchedLocale ? new Date() : null,
        testerNote: body.testerNote ?? null,
        userAgent,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch {
    return NextResponse.json({ error: "Could not create session" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as {
      sessionId: string;
      testerNote?: string;
    };

    if (!body.sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    const updated = await prisma.evaluationSession.update({
      where: { id: body.sessionId },
      data: {
        ...(body.testerNote !== undefined ? { testerNote: body.testerNote } : {}),
      },
    });

    return NextResponse.json({ ok: true, sessionId: updated.id });
  } catch {
    return NextResponse.json({ error: "Could not update session" }, { status: 500 });
  }
}
