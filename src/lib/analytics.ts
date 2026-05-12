// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS-1 — Conversational Product Intelligence Layer
// Pure utility functions. No AI, no runtime changes.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "./prisma";

// ── CTA detection ─────────────────────────────────────────────────────────────

export type CtaType =
  | "contact"
  | "workshop"
  | "advisory"
  | "diagnostic"
  | "sourcing"
  | "negotiation"
  | "generic";

const CTA_PATTERNS: Array<{ type: CtaType; patterns: RegExp[] }> = [
  {
    type: "contact",
    patterns: [
      /zapraszam (do|na) kontakt/i,
      /zachęcam do kontaktu/i,
      /proszę o kontakt/i,
      /skontaktuj się/i,
      /contact us|reach out|get in touch/i,
    ],
  },
  {
    type: "workshop",
    patterns: [
      /warsztat|szkolenie|workshop/i,
      /negocjacyjny warsztat|procurement academy/i,
      /training session/i,
    ],
  },
  {
    type: "advisory",
    patterns: [
      /advisory call|rozmowa doradcza|konsultacja/i,
      /advisory engagement|doradztwo/i,
    ],
  },
  {
    type: "diagnostic",
    patterns: [
      /spot analysis|diagnostic|diagnoza/i,
      /quick assessment|szybka ocena/i,
    ],
  },
  {
    type: "sourcing",
    patterns: [
      /sourcing support|wsparcie sourcingowe/i,
      /supplier (search|selection)/i,
      /dostawcy alternatywni/i,
    ],
  },
  {
    type: "negotiation",
    patterns: [
      /negotiation support|wsparcie negocjacyjne/i,
      /przygotowanie do negocjacji/i,
      /negocjuj(my|emy)/i,
    ],
  },
];

export function detectCtaType(content: string): CtaType | null {
  for (const { type, patterns } of CTA_PATTERNS) {
    if (patterns.some((p) => p.test(content))) return type;
  }
  // Generic CTA: ends with offer of help / contact
  if (/profitia\.pl|chętnie pomożemy|let us help|happy to (help|discuss)/i.test(content)) {
    return "generic";
  }
  return null;
}

// ── Depth scoring heuristics ──────────────────────────────────────────────────
// +1 per exchange, +2 follow-up, +3 negotiation/emotional, +5 CTA/feedback

const DEPTH_NEGOTIATION_RE = /dostawca|negocjacj|oferta|podwyżka|supplier|negotiat|price increase/i;
const DEPTH_EMOTIONAL_RE   = /panika|kryzys|chaos|nie dajemy rady|overwhelm|crisis|firefighting/i;

export function computeDepthDelta(
  userContent: string,
  assistantContent: string,
  isFollowup: boolean,
  ctaFound: boolean,
): number {
  let score = 1; // base: each exchange = +1
  if (isFollowup) score += 2;
  if (DEPTH_NEGOTIATION_RE.test(userContent + " " + assistantContent)) score += 3;
  if (DEPTH_EMOTIONAL_RE.test(userContent))  score += 3;
  if (ctaFound) score += 5;
  return score;
}

// ── Visitor hash ──────────────────────────────────────────────────────────────
// Lightweight, no PII. Combines truncated IP + user-agent for heuristic dedup.

export function buildVisitorHash(ip: string | null, userAgent: string | null): string {
  const ipFragment = (ip ?? "").split(".").slice(0, 3).join(".");  // e.g. "1.2.3"
  const ua = (userAgent ?? "").slice(0, 80);
  const raw = `${ipFragment}|${ua}`;
  // Simple djb2 hash — fast, deterministic, no crypto needed
  let h = 5381;
  for (let i = 0; i < raw.length; i++) {
    h = ((h << 5) + h) ^ raw.charCodeAt(i);
    h >>>= 0; // keep unsigned 32-bit
  }
  return h.toString(16).padStart(8, "0");
}

// ── Session lifecycle helpers ─────────────────────────────────────────────────

/** Called when session is created — initializes SessionAnalytics row */
export async function initSessionAnalytics(sessionId: string, locale: string): Promise<void> {
  await prisma.sessionAnalytics.create({
    data: { sessionId, locale, startedAt: new Date() },
  });
}

/** Called when user sends first message — marks conversation as started */
export async function markConversationStarted(sessionId: string): Promise<void> {
  await prisma.sessionAnalytics.updateMany({
    where: { sessionId, conversationStartedAt: null },
    data: { conversationStartedAt: new Date() },
  });
}

/** Called after each AI response — increments counters, updates depth + CTA */
export async function updateSessionAnalytics(opts: {
  sessionId: string;
  userContent: string;
  assistantContent: string;
  isFirstExchange: boolean;
  responseTimeMs?: number;
}): Promise<void> {
  const { sessionId, userContent, assistantContent, isFirstExchange, responseTimeMs } = opts;

  const existing = await prisma.sessionAnalytics.findUnique({ where: { sessionId } });
  if (!existing) return;

  const ctaType = detectCtaType(assistantContent);
  const depthDelta = computeDepthDelta(
    userContent,
    assistantContent,
    !isFirstExchange,
    ctaType !== null,
  );

  // Rolling average for response time
  let avgResponse = existing.averageResponseTimeMs;
  if (responseTimeMs != null) {
    const count = existing.totalAssistantMessages + 1;
    avgResponse = existing.averageResponseTimeMs == null
      ? responseTimeMs
      : Math.round(((existing.averageResponseTimeMs * (count - 1)) + responseTimeMs) / count);
  }

  await prisma.sessionAnalytics.update({
    where: { sessionId },
    data: {
      totalMessages:           { increment: 2 },
      totalUserMessages:       { increment: 1 },
      totalAssistantMessages:  { increment: 1 },
      conversationDepthScore:  { increment: depthDelta },
      ...(avgResponse != null ? { averageResponseTimeMs: avgResponse } : {}),
      ...(ctaType ? { ctaReached: true, ctaType } : {}),
    },
  });
}

/** Called when session ends (locale switch, window close via beacon) */
export async function finalizeSession(sessionId: string, abandoned: boolean): Promise<void> {
  const analytics = await prisma.sessionAnalytics.findUnique({ where: { sessionId } });
  if (!analytics) return;

  const endedAt = new Date();
  const durationMs = endedAt.getTime() - analytics.startedAt.getTime();
  const completedConversation = analytics.totalUserMessages >= 3;

  await prisma.sessionAnalytics.update({
    where: { sessionId },
    data: {
      endedAt,
      sessionDurationMs: durationMs,
      abandoned,
      completedConversation,
    },
  });
}

/** Called when feedback is submitted */
export async function markFeedbackSubmitted(sessionId: string): Promise<void> {
  await prisma.sessionAnalytics.updateMany({
    where: { sessionId },
    data: {
      feedbackSubmitted: true,
      conversationDepthScore: { increment: 5 },
    },
  });
}

// ── Daily snapshot generation ─────────────────────────────────────────────────

function startOfDayUtc(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export async function generateDailySnapshot(date: Date = new Date()): Promise<void> {
  const dayStart = startOfDayUtc(date);
  const dayEnd   = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const [visits, analytics, feedback] = await Promise.all([
    prisma.appVisit.findMany({
      where: { createdAt: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.sessionAnalytics.findMany({
      where: { startedAt: { gte: dayStart, lt: dayEnd } },
    }),
    prisma.messageFeedback.findMany({
      where: {
        createdAt: { gte: dayStart, lt: dayEnd },
      },
    }),
  ]);

  const conversations = analytics.filter((s) => s.conversationStartedAt != null);
  const abandoned     = analytics.filter((s) => s.abandoned);
  const withFeedback  = analytics.filter((s) => s.feedbackSubmitted);

  const depthScores = analytics.map((s) => s.conversationDepthScore);
  const durations   = analytics.filter((s) => s.sessionDurationMs != null).map((s) => s.sessionDurationMs as number);

  const allRatings = feedback.flatMap((f) =>
    [f.naturalness, f.adequacy, f.practicality, f.practitionerFeel, f.trustLevel]
      .filter((v): v is number => v != null)
  );

  await prisma.dailyAnalyticsSnapshot.upsert({
    where: { date: dayStart },
    create: {
      date: dayStart,
      totalVisits:        visits.length,
      totalSessions:      analytics.length,
      totalConversations: conversations.length,
      totalMessages:      analytics.reduce((s, a) => s + a.totalMessages, 0),
      plVisits:           visits.filter((v) => v.locale === "pl").length,
      enVisits:           visits.filter((v) => v.locale === "en").length,
      plSessions:         analytics.filter((s) => s.locale === "pl").length,
      enSessions:         analytics.filter((s) => s.locale === "en").length,
      avgDepthScore:      avg(depthScores),
      avgDurationMs:      avg(durations),
      avgFeedbackScore:   avg(allRatings),
      abandonmentRate:    analytics.length > 0 ? abandoned.length / analytics.length : null,
      feedbackRate:       analytics.length > 0 ? withFeedback.length / analytics.length : null,
    },
    update: {
      totalVisits:        visits.length,
      totalSessions:      analytics.length,
      totalConversations: conversations.length,
      totalMessages:      analytics.reduce((s, a) => s + a.totalMessages, 0),
      plVisits:           visits.filter((v) => v.locale === "pl").length,
      enVisits:           visits.filter((v) => v.locale === "en").length,
      plSessions:         analytics.filter((s) => s.locale === "pl").length,
      enSessions:         analytics.filter((s) => s.locale === "en").length,
      avgDepthScore:      avg(depthScores),
      avgDurationMs:      avg(durations),
      avgFeedbackScore:   avg(allRatings),
      abandonmentRate:    analytics.length > 0 ? abandoned.length / analytics.length : null,
      feedbackRate:       analytics.length > 0 ? withFeedback.length / analytics.length : null,
    },
  });
}

// ── Aggregate query helpers (for future dashboard) ────────────────────────────

export async function getLocaleBreakdown(): Promise<{
  pl: { sessions: number; avgDepth: number | null; avgFeedback: number | null; abandonRate: number | null };
  en: { sessions: number; avgDepth: number | null; avgFeedback: number | null; abandonRate: number | null };
}> {
  const sessions = await prisma.sessionAnalytics.findMany();

  function localeStats(locale: string) {
    const s = sessions.filter((x) => x.locale === locale);
    const depths = s.map((x) => x.conversationDepthScore);
    const abandoned = s.filter((x) => x.abandoned).length;
    return {
      sessions:    s.length,
      avgDepth:    avg(depths),
      avgFeedback: null as null, // resolved separately if needed
      abandonRate: s.length > 0 ? abandoned / s.length : null,
    };
  }

  return { pl: localeStats("pl"), en: localeStats("en") };
}

export async function getRecentConversationMetrics(days = 7): Promise<{
  totalSessions: number;
  totalConversations: number;
  avgDepth: number | null;
  avgDuration: number | null;
  feedbackRate: number | null;
  abandonRate: number | null;
}> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const s = await prisma.sessionAnalytics.findMany({ where: { startedAt: { gte: since } } });

  const conversations = s.filter((x) => x.conversationStartedAt != null).length;
  const depths        = s.map((x) => x.conversationDepthScore);
  const durations     = s.filter((x) => x.sessionDurationMs != null).map((x) => x.sessionDurationMs as number);
  const abandoned     = s.filter((x) => x.abandoned).length;
  const withFeedback  = s.filter((x) => x.feedbackSubmitted).length;

  return {
    totalSessions:     s.length,
    totalConversations: conversations,
    avgDepth:          avg(depths),
    avgDuration:       avg(durations),
    feedbackRate:      s.length > 0 ? withFeedback / s.length : null,
    abandonRate:       s.length > 0 ? abandoned / s.length : null,
  };
}
