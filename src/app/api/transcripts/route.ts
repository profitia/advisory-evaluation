import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Admin-protected endpoint — requires ADMIN_TOKEN header
function isAuthorized(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return true; // if not configured, allow (dev mode)
  return token === expected;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Optional locale filter: ?locale=pl | ?locale=en
    const { searchParams } = new URL(req.url);
    const localeFilter = searchParams.get("locale");

    const sessions = await prisma.evaluationSession.findMany({
      where: localeFilter
        ? { sessionLocale: localeFilter }
        : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: {
            feedback: true,
            reviewTags: { select: { tag: true, valence: true } },
          },
        },
        metric: true,
        reviewerNote: true,
        behavioralSignals: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            messageId: true,
            draftDurationMs: true,
            responseLatencyMs: true,
            backspaceCount: true,
            pastedChars: true,
            finalLength: true,
            hesitationMs: true,
            emotionalState: true,
            ctaClicked: true,
            ctaLabel: true,
            isAbandonmentPoint: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json(sessions);
  } catch {
    return NextResponse.json({ error: "Could not load transcripts" }, { status: 500 });
  }
}
