// ANALYTICS-1 — Session lifecycle events
// POST /api/session-events — non-blocking fire-and-forget from client

import { NextRequest, NextResponse } from "next/server";
import {
  markConversationStarted,
  updateSessionAnalytics,
  finalizeSession,
  markFeedbackSubmitted,
} from "@/lib/analytics";

type SessionEvent =
  | { event: "conversation_started"; sessionId: string }
  | { event: "message_exchange"; sessionId: string; userContent: string; assistantContent: string; isFirstExchange: boolean; responseTimeMs?: number }
  | { event: "session_ended"; sessionId: string; abandoned: boolean }
  | { event: "feedback_submitted"; sessionId: string };

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as SessionEvent;

    if (!body.sessionId || body.sessionId.startsWith("offline-")) {
      return NextResponse.json({ ok: true }); // offline mode — skip silently
    }

    switch (body.event) {
      case "conversation_started":
        await markConversationStarted(body.sessionId);
        break;

      case "message_exchange":
        await updateSessionAnalytics({
          sessionId:       body.sessionId,
          userContent:     body.userContent,
          assistantContent: body.assistantContent,
          isFirstExchange: body.isFirstExchange,
          responseTimeMs:  body.responseTimeMs,
        });
        break;

      case "session_ended":
        await finalizeSession(body.sessionId, body.abandoned);
        break;

      case "feedback_submitted":
        await markFeedbackSubmitted(body.sessionId);
        break;

      default:
        return NextResponse.json({ error: "Unknown event" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    // Analytics failures must never break the app
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
