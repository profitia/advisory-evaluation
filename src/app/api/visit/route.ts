// ANALYTICS-1 — App Visit tracking
// Called from client on page load. Registers visit, computes visitor hash.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildVisitorHash } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      locale?: string;
      sessionId?: string;
      referrer?: string;
      landingPath?: string;
    };

    const locale    = body.locale === "en" ? "en" : "pl";
    const userAgent = req.headers.get("user-agent") ?? null;
    const referrer  = body.referrer ?? req.headers.get("referer") ?? null;

    // Heuristic visitor hash — no PII stored
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : null;
    const visitorHash = buildVisitorHash(ip, userAgent);

    // Repeat visitor estimation — count prior visits with same hash (last 30d)
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const priorVisits = await prisma.appVisit.count({
      where: {
        visitorHash,
        createdAt: { gte: since },
      },
    });

    const visit = await prisma.appVisit.create({
      data: {
        locale,
        sessionId:          body.sessionId ?? null,
        userAgent,
        referrer,
        landingPath:        body.landingPath ?? "/",
        visitorHash,
        repeatVisitor:      priorVisits > 0,
        estimatedVisitCount: priorVisits + 1,
      },
    });

    return NextResponse.json({ visitId: visit.id, repeatVisitor: visit.repeatVisitor });
  } catch {
    // Analytics failures are silent — never block UX
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
