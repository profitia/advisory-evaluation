import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function isAuthorized(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token");
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return true;
  return token === expected;
}

// POST — add/remove review tag OR upsert reviewer note field
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json() as {
      type: "tag" | "note";
      // Tag fields
      messageId?: string;
      tag?: string;
      valence?: string;
      action?: "add" | "remove";
      // Note fields
      sessionId?: string;
      field?: string;
      value?: string;
    };

    if (body.type === "tag") {
      if (!body.messageId || !body.tag || !body.valence) {
        return NextResponse.json({ error: "messageId, tag, valence required" }, { status: 400 });
      }

      if (body.action === "remove") {
        await prisma.reviewTag.deleteMany({
          where: { messageId: body.messageId, tag: body.tag },
        });
        return NextResponse.json({ removed: body.tag });
      }

      const reviewTag = await prisma.reviewTag.upsert({
        where: { messageId_tag: { messageId: body.messageId, tag: body.tag } },
        update: { valence: body.valence },
        create: { messageId: body.messageId, tag: body.tag, valence: body.valence },
      });
      return NextResponse.json({ tagId: reviewTag.id });
    }

    if (body.type === "note") {
      if (!body.sessionId || !body.field) {
        return NextResponse.json({ error: "sessionId, field required" }, { status: 400 });
      }

      const allowedFields = ["overallImpression", "goodMoments", "badMoments", "llmPerfect"];
      if (!allowedFields.includes(body.field)) {
        return NextResponse.json({ error: "Invalid field" }, { status: 400 });
      }

      const note = await prisma.reviewerNote.upsert({
        where: { sessionId: body.sessionId },
        update: { [body.field]: body.value ?? "" },
        create: {
          sessionId: body.sessionId,
          [body.field]: body.value ?? "",
        },
      });
      return NextResponse.json({ noteId: note.id });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}

// GET — load tags + note for a session
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  try {
    const [note, tags, signals] = await Promise.all([
      prisma.reviewerNote.findUnique({ where: { sessionId } }),
      prisma.reviewTag.findMany({
        where: { message: { sessionId } },
        select: { messageId: true, tag: true, valence: true },
      }),
      prisma.behavioralSignal.findMany({
        where: { sessionId },
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
      }),
    ]);

    return NextResponse.json({ note, tags, signals });
  } catch {
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
