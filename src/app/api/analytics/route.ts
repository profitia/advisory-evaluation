// ANALYTICS-1 — Analytics aggregate API
// Provides aggregate data for future dashboard. Protected by ADMIN_TOKEN.

import { NextRequest, NextResponse } from "next/server";
import {
  getLocaleBreakdown,
  getRecentConversationMetrics,
  generateDailySnapshot,
} from "@/lib/analytics";
import { prisma } from "@/lib/prisma";

function isAuthorized(req: NextRequest): boolean {
  const token = req.headers.get("x-admin-token") ?? req.nextUrl.searchParams.get("token");
  return token === process.env.ADMIN_TOKEN;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const view = req.nextUrl.searchParams.get("view") ?? "summary";

  try {
    if (view === "summary") {
      const [recent, locales] = await Promise.all([
        getRecentConversationMetrics(7),
        getLocaleBreakdown(),
      ]);
      return NextResponse.json({ recent, locales });
    }

    if (view === "snapshots") {
      const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30", 10);
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const snapshots = await prisma.dailyAnalyticsSnapshot.findMany({
        where: { date: { gte: since } },
        orderBy: { date: "desc" },
      });
      return NextResponse.json({ snapshots });
    }

    if (view === "sessions") {
      const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10), 200);
      const sessions = await prisma.sessionAnalytics.findMany({
        orderBy: { startedAt: "desc" },
        take: limit,
      });
      return NextResponse.json({ sessions });
    }

    if (view === "visits") {
      const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10), 200);
      const visits = await prisma.appVisit.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return NextResponse.json({ visits });
    }

    return NextResponse.json({ error: "Unknown view" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Query failed" }, { status: 500 });
  }
}

// POST /api/analytics — trigger snapshot generation or session finalization
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json() as { action?: string; date?: string };

    if (body.action === "snapshot") {
      const date = body.date ? new Date(body.date) : new Date();
      await generateDailySnapshot(date);
      return NextResponse.json({ ok: true, date: date.toISOString().slice(0, 10) });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
