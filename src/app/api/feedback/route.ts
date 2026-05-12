import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { FeedbackPayload } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as FeedbackPayload;

    if (!body.messageId) {
      return NextResponse.json({ error: "messageId required" }, { status: 400 });
    }

    // Validate ratings are 1-5 integers if provided
    const ratingFields = ["naturalness", "adequacy", "practicality", "practitionerFeel", "trustLevel"] as const;
    for (const field of ratingFields) {
      const val = body[field];
      if (val !== undefined) {
        const n = Number(val);
        if (!Number.isInteger(n) || n < 1 || n > 5) {
          return NextResponse.json({ error: `${field} must be integer 1-5` }, { status: 400 });
        }
      }
    }

    const feedback = await prisma.messageFeedback.upsert({
      where: { messageId: body.messageId },
      create: {
        messageId: body.messageId,
        naturalness: body.naturalness,
        adequacy: body.adequacy,
        practicality: body.practicality,
        practitionerFeel: body.practitionerFeel,
        trustLevel: body.trustLevel,
        whatWasUnnatural: body.whatWasUnnatural?.slice(0, 2000),
        whatWasValuable: body.whatWasValuable?.slice(0, 2000),
        whatSoundedAI: body.whatSoundedAI?.slice(0, 2000),
        tooConsulting: body.tooConsulting?.slice(0, 2000),
        tooLong: body.tooLong?.slice(0, 2000),
        tooConfident: body.tooConfident?.slice(0, 2000),
        freeComment: body.freeComment?.slice(0, 4000),
      },
      update: {
        naturalness: body.naturalness,
        adequacy: body.adequacy,
        practicality: body.practicality,
        practitionerFeel: body.practitionerFeel,
        trustLevel: body.trustLevel,
        whatWasUnnatural: body.whatWasUnnatural?.slice(0, 2000),
        whatWasValuable: body.whatWasValuable?.slice(0, 2000),
        whatSoundedAI: body.whatSoundedAI?.slice(0, 2000),
        tooConsulting: body.tooConsulting?.slice(0, 2000),
        tooLong: body.tooLong?.slice(0, 2000),
        tooConfident: body.tooConfident?.slice(0, 2000),
        freeComment: body.freeComment?.slice(0, 4000),
      },
    });

    // Update session-level metrics
    const message = await prisma.evaluationMessage.findUnique({
      where: { id: body.messageId },
      select: { sessionId: true },
    });

    if (message?.sessionId) {
      // Recalculate averages for this session
      const allFeedback = await prisma.messageFeedback.findMany({
        where: {
          message: { sessionId: message.sessionId },
        },
        select: {
          naturalness: true,
          adequacy: true,
          practicality: true,
          practitionerFeel: true,
          trustLevel: true,
        },
      });

      const avg = (arr: (number | null)[]): number | null => {
        const vals = arr.filter((v): v is number => v !== null);
        return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
      };

      await prisma.conversationMetric.upsert({
        where: { sessionId: message.sessionId },
        create: {
          sessionId: message.sessionId,
          totalFeedbackGiven: allFeedback.length,
          avgNaturalness: avg(allFeedback.map((f) => f.naturalness)),
          avgAdequacy: avg(allFeedback.map((f) => f.adequacy)),
          avgPracticality: avg(allFeedback.map((f) => f.practicality)),
          avgPractitionerFeel: avg(allFeedback.map((f) => f.practitionerFeel)),
          avgTrustLevel: avg(allFeedback.map((f) => f.trustLevel)),
        },
        update: {
          totalFeedbackGiven: allFeedback.length,
          avgNaturalness: avg(allFeedback.map((f) => f.naturalness)),
          avgAdequacy: avg(allFeedback.map((f) => f.adequacy)),
          avgPracticality: avg(allFeedback.map((f) => f.practicality)),
          avgPractitionerFeel: avg(allFeedback.map((f) => f.practitionerFeel)),
          avgTrustLevel: avg(allFeedback.map((f) => f.trustLevel)),
        },
      });
    }

    return NextResponse.json({ ok: true, feedbackId: feedback.id });
  } catch {
    return NextResponse.json({ error: "Could not save feedback" }, { status: 500 });
  }
}
