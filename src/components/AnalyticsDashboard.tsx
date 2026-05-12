"use client";

import { useEffect, useState } from "react";
import type { TranscriptSession } from "@/lib/types";
import { EMOTIONAL_STATE_LABELS } from "@/lib/emotionalEstimator";
import type { EmotionalState } from "@/lib/emotionalEstimator";

interface Props {
  adminToken?: string;
}

// ── Metric card ───────────────────────────────────────────

function MetricCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <p className="text-2xl font-semibold text-gray-800">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-gray-300 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Tag frequency chart ───────────────────────────────────

function TagFrequency({ sessions }: { sessions: TranscriptSession[] }) {
  const tagCounts: Record<string, { count: number; valence: string }> = {};

  sessions.forEach((s) => {
    s.messages.forEach((m) => {
      m.reviewTags?.forEach((t) => {
        if (!tagCounts[t.tag]) tagCounts[t.tag] = { count: 0, valence: t.valence };
        tagCounts[t.tag].count++;
      });
    });
  });

  const sorted = Object.entries(tagCounts).sort(([, a], [, b]) => b.count - a.count);
  const maxCount = sorted[0]?.[1]?.count ?? 1;

  if (sorted.length === 0) {
    return <p className="text-xs text-gray-300 italic">Brak tagów reviewera.</p>;
  }

  return (
    <div className="space-y-2">
      {sorted.map(([tag, { count, valence }]) => (
        <div key={tag} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-36 shrink-0">{tag}</span>
          <div className="flex-1 bg-gray-50 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${valence === "positive" ? "bg-emerald-500" : "bg-red-400"}`}
              style={{ width: `${(count / maxCount) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 w-6 text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}

// ── Interaction mode performance ──────────────────────────

function ModePerformance({ sessions }: { sessions: TranscriptSession[] }) {
  const modes: Record<string, { naturalness: number[]; trustLevel: number[]; count: number }> = {};

  sessions.forEach((s) => {
    s.messages.forEach((m) => {
      if (m.role !== "assistant" || !m.interactionMode) return;
      const mode = m.interactionMode;
      if (!modes[mode]) modes[mode] = { naturalness: [], trustLevel: [], count: 0 };
      modes[mode].count++;
      if (m.feedback?.naturalness) modes[mode].naturalness.push(m.feedback.naturalness);
      if (m.feedback?.trustLevel) modes[mode].trustLevel.push(m.feedback.trustLevel);
    });
  });

  const rows = Object.entries(modes)
    .map(([mode, { naturalness, trustLevel, count }]) => ({
      mode,
      count,
      avgNat: naturalness.length ? naturalness.reduce((a, b) => a + b) / naturalness.length : null,
      avgTrust: trustLevel.length ? trustLevel.reduce((a, b) => a + b) / trustLevel.length : null,
      rated: naturalness.length,
    }))
    .sort((a, b) => (b.avgNat ?? 0) - (a.avgNat ?? 0));

  if (rows.length === 0) {
    return <p className="text-xs text-gray-300 italic">Brak danych o trybach.</p>;
  }

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-gray-400 text-left">
          <th className="pb-2 font-normal">Tryb</th>
          <th className="pb-2 font-normal text-center">Naturalność</th>
          <th className="pb-2 font-normal text-center">Zaufanie</th>
          <th className="pb-2 font-normal text-center">Odpowiedzi</th>
          <th className="pb-2 font-normal text-center">Ocenione</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ mode, count, avgNat, avgTrust, rated }) => (
          <tr key={mode} className="border-t border-gray-50">
            <td className="py-2 text-gray-600 font-medium">{mode}</td>
            <td className="py-2 text-center">
              {avgNat != null ? (
                <span className={avgNat >= 4 ? "text-green-600 font-semibold" : avgNat >= 3 ? "text-amber-600" : "text-red-500"}>
                  {avgNat.toFixed(2)}
                </span>
              ) : <span className="text-gray-300">—</span>}
            </td>
            <td className="py-2 text-center">
              {avgTrust != null ? (
                <span className={avgTrust >= 4 ? "text-green-600 font-semibold" : avgTrust >= 3 ? "text-amber-600" : "text-red-500"}>
                  {avgTrust.toFixed(2)}
                </span>
              ) : <span className="text-gray-300">—</span>}
            </td>
            <td className="py-2 text-center text-gray-500">{count}</td>
            <td className="py-2 text-center text-gray-500">{rated}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Emotional trajectory ──────────────────────────────────

function EmotionalTrajectory({ sessions }: { sessions: TranscriptSession[] }) {
  const stateCounts: Partial<Record<EmotionalState, number>> = {};
  let total = 0;

  sessions.forEach((s) => {
    s.behavioralSignals?.forEach((sig) => {
      if (sig.emotionalState) {
        const state = sig.emotionalState as EmotionalState;
        stateCounts[state] = (stateCounts[state] ?? 0) + 1;
        total++;
      }
    });
  });

  if (total === 0) {
    return <p className="text-xs text-gray-300 italic">Brak sygnałów emocjonalnych.</p>;
  }

  const sorted = Object.entries(stateCounts).sort(([, a], [, b]) => (b ?? 0) - (a ?? 0)) as [EmotionalState, number][];

  return (
    <div className="space-y-2">
      {sorted.map(([state, count]) => {
        const { label, color } = EMOTIONAL_STATE_LABELS[state];
        const pct = Math.round((count / total) * 100);
        return (
          <div key={state} className="flex items-center gap-3">
            <span className={`text-xs px-2 py-0.5 rounded border font-medium w-28 shrink-0 text-center ${color}`}>
              {label}
            </span>
            <div className="flex-1 bg-gray-50 rounded-full h-1.5 overflow-hidden">
              <div className="h-full rounded-full bg-gray-300" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-400 w-10 text-right">{pct}% · {count}</span>
          </div>
        );
      })}
      <p className="text-xs text-gray-300 pt-1">{total} user turns with signal</p>
    </div>
  );
}

// ── Behavioral aggregates ─────────────────────────────────

function BehavioralAggregates({ sessions }: { sessions: TranscriptSession[] }) {
  const signals = sessions.flatMap((s) => s.behavioralSignals ?? []);

  if (signals.length === 0) {
    return <p className="text-xs text-gray-300 italic">Brak sygnałów behawioralnych.</p>;
  }

  const avg = (vals: (number | null | undefined)[]) => {
    const nums = vals.filter((v): v is number => v != null && !isNaN(v));
    return nums.length ? Math.round(nums.reduce((a, b) => a + b) / nums.length) : null;
  };

  const avgDraft = avg(signals.map((s) => s.draftDurationMs));
  const avgLatency = avg(signals.map((s) => s.responseLatencyMs));
  const avgHesitation = avg(signals.map((s) => s.hesitationMs));
  const avgBackspace = avg(signals.map((s) => s.backspaceCount));
  const pasteRate = signals.length
    ? Math.round((signals.filter((s) => (s.pastedChars ?? 0) > 0).length / signals.length) * 100)
    : 0;
  const ctaClicks = signals.filter((s) => s.ctaClicked).length;

  const fmtMs = (ms: number | null) => {
    if (ms == null) return "—";
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: "Avg. draft time", value: fmtMs(avgDraft), sub: "first key → send" },
        { label: "Avg. response latency", value: fmtMs(avgLatency), sub: "assistant done → typing" },
        { label: "Avg. hesitation", value: fmtMs(avgHesitation), sub: "last key → send" },
        { label: "Avg. backspaces", value: avgBackspace != null ? `${avgBackspace}` : "—", sub: "per message" },
        { label: "Paste rate", value: `${pasteRate}%`, sub: "messages w/ paste" },
        { label: "CTA clicks", value: ctaClicks, sub: "total" },
      ].map(({ label, value, sub }) => (
        <div key={label} className="bg-gray-50 rounded-lg p-3">
          <p className="text-base font-semibold text-gray-700">{value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          <p className="text-xs text-gray-300">{sub}</p>
        </div>
      ))}
    </div>
  );
}

// ── PL vs EN realism ──────────────────────────────────────

function LocaleRealism({ sessions }: { sessions: TranscriptSession[] }) {
  const compute = (locale: "pl" | "en") => {
    const msgs = sessions
      .filter((s) => s.sessionLocale === locale)
      .flatMap((s) => s.messages.filter((m) => m.role === "assistant" && m.feedback));
    const avg = (key: keyof NonNullable<(typeof msgs)[0]["feedback"]>) => {
      const vals = msgs.map((m) => m.feedback?.[key]).filter((v): v is number => typeof v === "number");
      return vals.length ? vals.reduce((a, b) => a + b) / vals.length : null;
    };
    return {
      sessions: sessions.filter((s) => s.sessionLocale === locale).length,
      messages: msgs.length,
      naturalness: avg("naturalness"),
      practitionerFeel: avg("practitionerFeel"),
      trustLevel: avg("trustLevel"),
    };
  };

  const pl = compute("pl");
  const en = compute("en");

  const Row = ({ label, pl: p, en: e }: { label: string; pl: number | null; en: number | null }) => {
    const fmt = (v: number | null) => v != null ? (
      <span className={v >= 4 ? "text-green-600 font-semibold" : v >= 3 ? "text-amber-600" : "text-red-500"}>
        {v.toFixed(2)}
      </span>
    ) : <span className="text-gray-300">—</span>;

    return (
      <tr className="border-t border-gray-50">
        <td className="py-2 text-xs text-gray-500">{label}</td>
        <td className="py-2 text-xs text-center">{fmt(p)}</td>
        <td className="py-2 text-xs text-center">{fmt(e)}</td>
      </tr>
    );
  };

  return (
    <table className="w-full">
      <thead>
        <tr className="text-gray-400 text-xs">
          <th className="text-left pb-2 font-normal">Kryterium</th>
          <th className="text-center pb-2 font-normal">🇵🇱 PL ({pl.sessions} sesji, {pl.messages} msg)</th>
          <th className="text-center pb-2 font-normal">🇬🇧 EN ({en.sessions} sesji, {en.messages} msg)</th>
        </tr>
      </thead>
      <tbody>
        <Row label="Naturalność" pl={pl.naturalness} en={en.naturalness} />
        <Row label="Brzmi jak praktyk" pl={pl.practitionerFeel} en={en.practitionerFeel} />
        <Row label="Poziom zaufania" pl={pl.trustLevel} en={en.trustLevel} />
      </tbody>
    </table>
  );
}

// ── Abandonment analysis ──────────────────────────────────

function AbandonmentAnalysis({ sessions }: { sessions: TranscriptSession[] }) {
  const turnCounts: Record<number, number> = {};
  let withFeedback = 0;
  let without = 0;

  sessions.forEach((s) => {
    const assistantMsgs = s.messages.filter((m) => m.role === "assistant");
    const lastIdx = assistantMsgs.length;
    turnCounts[lastIdx] = (turnCounts[lastIdx] ?? 0) + 1;
    if (s.metric && s.metric.totalFeedbackGiven > 0) withFeedback++;
    else without++;
  });

  const avgTurns = sessions.length
    ? (sessions.reduce((acc, s) => acc + s.messages.filter((m) => m.role === "assistant").length, 0) / sessions.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-3">
      <div className="flex gap-6 text-xs text-gray-500">
        <span>Avg turns: <strong className="text-gray-700">{avgTurns}</strong></span>
        <span>With feedback: <strong className="text-gray-700">{withFeedback}</strong></span>
        <span>No feedback: <strong className="text-gray-700">{without}</strong></span>
      </div>
      <div className="space-y-1">
        {Object.entries(turnCounts)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([turns, count]) => (
            <div key={turns} className="flex items-center gap-3 text-xs">
              <span className="text-gray-400 w-20 shrink-0">after {turns} turn{Number(turns) !== 1 ? "s" : ""}</span>
              <div className="flex-1 bg-gray-50 rounded-full h-1 overflow-hidden">
                <div className="h-full bg-gray-300 rounded-full" style={{ width: `${(count / sessions.length) * 100}%` }} />
              </div>
              <span className="text-gray-400 w-4 text-right">{count}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

// ── Main dashboard ────────────────────────────────────────

export default function AnalyticsDashboard({ adminToken }: Props) {
  const [sessions, setSessions] = useState<TranscriptSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const headers: Record<string, string> = {};
    if (adminToken) headers["x-admin-token"] = adminToken;

    fetch("/api/transcripts", { headers })
      .then((r) => {
        if (r.status === 401) throw new Error("Unauthorized");
        return r.json();
      })
      .then((data: TranscriptSession[]) => {
        setSessions(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [adminToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        Ładowanie analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  const totalMessages = sessions.reduce((acc, s) => acc + s.messages.filter((m) => m.role === "assistant").length, 0);
  const totalRated = sessions.reduce((acc, s) => acc + (s.metric?.totalFeedbackGiven ?? 0), 0);
  const ratingRate = totalMessages > 0 ? Math.round((totalRated / totalMessages) * 100) : 0;
  const totalTags = sessions.reduce((acc, s) => acc + s.messages.reduce((a, m) => a + (m.reviewTags?.length ?? 0), 0), 0);
  const totalSignals = sessions.reduce((acc, s) => acc + (s.behavioralSignals?.length ?? 0), 0);

  const allRated = sessions.flatMap((s) => s.messages.filter((m) => m.role === "assistant" && m.feedback));
  const avgNat = allRated.length
    ? (allRated.map((m) => m.feedback!.naturalness ?? 0).reduce((a, b) => a + b) / allRated.filter((m) => m.feedback?.naturalness).length || 0)
    : null;
  const avgTrust = allRated.length
    ? (allRated.map((m) => m.feedback!.trustLevel ?? 0).reduce((a, b) => a + b) / allRated.filter((m) => m.feedback?.trustLevel).length || 0)
    : null;

  return (
    <div className="space-y-8">
      {/* Top summary row */}
      <div className="grid grid-cols-5 gap-3">
        <MetricCard label="Sesje" value={sessions.length} />
        <MetricCard label="Odpowiedzi asystenta" value={totalMessages} />
        <MetricCard label="Ocenione odpowiedzi" value={`${ratingRate}%`} sub={`${totalRated}/${totalMessages}`} />
        <MetricCard label="Tagi reviewera" value={totalTags} />
        <MetricCard label="Sygnały behawioralne" value={totalSignals} />
      </div>

      {/* Avg scores row */}
      {(avgNat != null || avgTrust != null) && (
        <div className="grid grid-cols-2 gap-3">
          {avgNat != null && <MetricCard label="Avg Naturalność (global)" value={avgNat.toFixed(2)} />}
          {avgTrust != null && <MetricCard label="Avg Zaufanie (global)" value={avgTrust.toFixed(2)} />}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          <section>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
              Tryby interakcji — performance
            </h3>
            <ModePerformance sessions={sessions} />
          </section>

          <section>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
              Analiza porzuceń
            </h3>
            <AbandonmentAnalysis sessions={sessions} />
          </section>

          <section>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
              Sygnały behawioralne — agregaty
            </h3>
            <BehavioralAggregates sessions={sessions} />
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <section>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
              Tagi reviewera — częstotliwość
            </h3>
            <TagFrequency sessions={sessions} />
          </section>

          <section>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
              Stany emocjonalne — rozkład
            </h3>
            <EmotionalTrajectory sessions={sessions} />
          </section>

          <section>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">
              PL vs EN — realism comparison
            </h3>
            <LocaleRealism sessions={sessions} />
          </section>
        </div>
      </div>
    </div>
  );
}
