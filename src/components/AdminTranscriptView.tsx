"use client";

import { useEffect, useState, useCallback } from "react";
import type { TranscriptSession, TranscriptMessage, ReviewerNoteData } from "@/lib/types";
import { EMOTIONAL_STATE_LABELS } from "@/lib/emotionalEstimator";
import type { EmotionalState } from "@/lib/emotionalEstimator";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ReviewTagPanel from "./ReviewTagPanel";

interface Props {
  adminToken?: string;
}

type LocaleFilter = "all" | "pl" | "en";

// ── Helpers ────────────────────────────────────────────────

function fmt(date: string) {
  return new Date(date).toLocaleString("pl-PL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function Score({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-gray-300">—</span>;
  const color = value >= 4 ? "text-green-600" : value >= 3 ? "text-amber-500" : "text-red-500";
  return <span className={`font-semibold ${color}`}>{value.toFixed(2)}</span>;
}

function RatingDots({ label, value }: { label: string; value: number | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-400 w-36 shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n}
            className={`w-3.5 h-3.5 rounded text-xs flex items-center justify-center font-medium ${
              n <= value ? "bg-profitia-navy text-white" : "bg-gray-100 text-gray-300"
            }`}
          >{n}</span>
        ))}
      </div>
    </div>
  );
}

function EmotionalBadge({ state }: { state: string | null | undefined }) {
  if (!state) return null;
  const config = EMOTIONAL_STATE_LABELS[state as EmotionalState];
  if (!config) return null;
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

// ── Reviewer notes form ────────────────────────────────────

function ReviewerNoteForm({
  sessionId,
  adminToken,
  initialNote,
}: {
  sessionId: string;
  adminToken?: string;
  initialNote: ReviewerNoteData | null;
}) {
  const [fields, setFields] = useState({
    overallImpression: initialNote?.overallImpression ?? "",
    goodMoments: initialNote?.goodMoments ?? "",
    badMoments: initialNote?.badMoments ?? "",
    llmPerfect: initialNote?.llmPerfect ?? "",
  });
  const [saving, setSaving] = useState<string | null>(null);

  const save = useCallback(async (field: string, value: string) => {
    setSaving(field);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (adminToken) headers["x-admin-token"] = adminToken;
      await fetch("/api/review", {
        method: "POST",
        headers,
        body: JSON.stringify({ type: "note", sessionId, field, value }),
      });
    } catch {
      // Silent
    } finally {
      setSaving(null);
    }
  }, [sessionId, adminToken]);

  const FIELDS: { key: keyof typeof fields; label: string; placeholder: string }[] = [
    { key: "overallImpression", label: "Ogólne wrażenie", placeholder: "Jak oceniasz tę sesję jako całość?" },
    { key: "goodMoments", label: "Gdzie brzmiał dobrze", placeholder: "Które odpowiedzi brzmiały naturalnie?" },
    { key: "badMoments", label: "Gdzie brzmiał sztucznie", placeholder: "Które odpowiedzi były wyraźnie AI?" },
    { key: "llmPerfect", label: "Zbyt LLM-perfect", placeholder: "Zbyt dopracowane, kompletne, bezpieczne?" },
  ];

  return (
    <div className="border-t border-gray-100 pt-4 mt-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Notatki reviewera</p>
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="text-xs text-gray-500 mb-1 block">{label}</label>
            <textarea
              value={fields[key]}
              onChange={(e) => setFields((prev) => ({ ...prev, [key]: e.target.value }))}
              onBlur={(e) => void save(key, e.target.value)}
              placeholder={placeholder}
              rows={2}
              className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-profitia-blue resize-none text-gray-700 placeholder-gray-300"
            />
            {saving === key && <span className="text-xs text-gray-300">saving…</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Feedback block ─────────────────────────────────────────

function FeedbackBlock({ feedback }: { feedback: TranscriptMessage["feedback"] }) {
  if (!feedback) return <span className="text-xs text-gray-300 italic">Brak oceny</span>;

  const hasText = [
    feedback.whatWasValuable, feedback.whatWasUnnatural, feedback.whatSoundedAI,
    feedback.tooConsulting, feedback.tooLong, feedback.tooConfident, feedback.freeComment,
  ].some(Boolean);

  return (
    <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
      <RatingDots label="Naturalność" value={feedback.naturalness} />
      <RatingDots label="Adekwatność" value={feedback.adequacy} />
      <RatingDots label="Praktyczność" value={feedback.practicality} />
      <RatingDots label="Brzmi jak praktyk?" value={feedback.practitionerFeel} />
      <RatingDots label="Poziom zaufania" value={feedback.trustLevel} />
      {hasText && (
        <div className="mt-2 pt-2 border-t border-gray-100 space-y-1 text-xs">
          {feedback.whatWasValuable && (
            <p><span className="text-emerald-600 font-medium">+ wartościowe: </span><span className="text-gray-600">{feedback.whatWasValuable}</span></p>
          )}
          {feedback.whatWasUnnatural && (
            <p><span className="text-amber-600 font-medium">~ nienaturalne: </span><span className="text-gray-600">{feedback.whatWasUnnatural}</span></p>
          )}
          {feedback.whatSoundedAI && (
            <p><span className="text-red-500 font-medium">- AI tone: </span><span className="text-gray-600">{feedback.whatSoundedAI}</span></p>
          )}
          {feedback.tooConsulting && (
            <p><span className="text-orange-500 font-medium">- zbyt konsult.: </span><span className="text-gray-600">{feedback.tooConsulting}</span></p>
          )}
          {feedback.freeComment && (
            <p><span className="text-gray-400 font-medium">nota: </span><span className="text-gray-600">{feedback.freeComment}</span></p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Session card ───────────────────────────────────────────

function SessionCard({ session, adminToken }: { session: TranscriptSession; adminToken?: string }) {
  const [expanded, setExpanded] = useState(false);
  const assistantMsgs = session.messages.filter((m) => m.role === "assistant");
  const feedbackCount = assistantMsgs.filter((m) => m.feedback).length;
  const tagCount = session.messages.reduce((acc, m) => acc + (m.reviewTags?.length ?? 0), 0);
  const localeFlag = session.sessionLocale === "pl" ? "🇵🇱" : "🇬🇧";

  // Map behavioral signals by messageId for quick lookup
  const signalByMsgId = new Map(
    (session.behavioralSignals ?? [])
      .filter((s) => s.messageId)
      .map((s) => [s.messageId!, s.emotionalState])
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-base shrink-0">{localeFlag}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-800">{fmt(session.createdAt)}</span>
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">
                {session.sessionLocale === "pl" ? "Polski Advisory" : "English Advisory"}
              </span>
              {session.userSwitchedLocale && (
                <span className="text-xs px-1.5 py-0.5 bg-amber-50 border border-amber-100 rounded text-amber-600">switched</span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-0.5 flex gap-3">
              <span>{session.messages.length} wiad.</span>
              <span>{feedbackCount}/{assistantMsgs.length} ocenionych</span>
              {tagCount > 0 && <span className="text-violet-500">{tagCount} tagów</span>}
              {session.reviewerNote?.overallImpression && <span className="text-blue-400">nota ✓</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 ml-4">
          {session.metric && (
            <div className="flex gap-3 text-xs text-gray-500">
              <span>Nat. <Score value={session.metric.avgNaturalness} /></span>
              <span>Prak. <Score value={session.metric.avgPractitionerFeel} /></span>
              <span>Trust <Score value={session.metric.avgTrustLevel} /></span>
            </div>
          )}
          <span className="text-gray-400 text-sm">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100">
          <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
            {session.messages.map((msg) => {
              const isUser = msg.role === "user";
              const emotionalState = isUser ? (signalByMsgId.get(msg.id) ?? null) : null;

              return (
                <div key={msg.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">{fmt(msg.createdAt)}</span>
                    {msg.interactionMode && (
                      <span className="text-xs text-gray-300">· {msg.interactionMode}</span>
                    )}
                    <EmotionalBadge state={emotionalState} />
                  </div>

                  <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm ${
                    isUser
                      ? "bg-profitia-navy text-white rounded-br-sm"
                      : "bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-sm"
                  }`}>
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="prose-advisory">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {!isUser && (
                    <div className="mt-1.5 w-full max-w-[88%] space-y-2">
                      <FeedbackBlock feedback={msg.feedback} />
                      <div>
                        <p className="text-xs text-gray-400 mb-1 mt-2">Tagi reviewera:</p>
                        <ReviewTagPanel
                          messageId={msg.id}
                          initialTags={msg.reviewTags}
                          adminToken={adminToken}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <ReviewerNoteForm
              sessionId={session.id}
              adminToken={adminToken}
              initialNote={session.reviewerNote}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── PL vs EN comparison ────────────────────────────────────

function LocaleComparison({ sessions }: { sessions: TranscriptSession[] }) {
  const compute = (locale: "pl" | "en") => {
    const locSessions = sessions.filter((s) => s.sessionLocale === locale);
    const msgs = locSessions.flatMap((s) => s.messages.filter((m) => m.role === "assistant" && m.feedback));
    const avg = (key: keyof NonNullable<TranscriptMessage["feedback"]>) => {
      const vals = msgs.map((m) => m.feedback?.[key]).filter((v): v is number => typeof v === "number");
      return vals.length ? vals.reduce((a, b) => a + b) / vals.length : null;
    };
    return {
      sessions: locSessions.length,
      rated: msgs.length,
      naturalness: avg("naturalness"),
      practitionerFeel: avg("practitionerFeel"),
      trustLevel: avg("trustLevel"),
      switched: locSessions.filter((s) => s.userSwitchedLocale).length,
    };
  };

  const pl = compute("pl");
  const en = compute("en");
  if (pl.sessions === 0 && en.sessions === 0) return null;

  const Row = ({ label, pl: p, en: e }: { label: string; pl: number | null; en: number | null }) => (
    <tr className="border-t border-gray-50">
      <td className="py-2 pr-4 text-xs text-gray-500">{label}</td>
      <td className="py-2 pr-4 text-xs text-center"><Score value={p} /></td>
      <td className="py-2 text-xs text-center"><Score value={e} /></td>
    </tr>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">PL vs EN — realism comparison</h3>
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left text-xs text-gray-300 pb-2 font-normal" />
            <th className="text-center text-xs pb-2 font-medium text-gray-500">🇵🇱 Polski ({pl.sessions} sesji)</th>
            <th className="text-center text-xs pb-2 font-medium text-gray-500">🇬🇧 English ({en.sessions} sesji)</th>
          </tr>
        </thead>
        <tbody>
          <Row label="Ocenionych msg" pl={pl.rated} en={en.rated} />
          <Row label="Naturalność" pl={pl.naturalness} en={en.naturalness} />
          <Row label="Brzmi jak praktyk" pl={pl.practitionerFeel} en={en.practitionerFeel} />
          <Row label="Poziom zaufania" pl={pl.trustLevel} en={en.trustLevel} />
          <Row label="Sesji z przełączeniem" pl={pl.switched} en={en.switched} />
        </tbody>
      </table>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────

export default function AdminTranscriptView({ adminToken }: Props) {
  const [sessions, setSessions] = useState<TranscriptSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localeFilter, setLocaleFilter] = useState<LocaleFilter>("all");

  const fetchSessions = useCallback((filter: LocaleFilter, token?: string) => {
    const headers: Record<string, string> = {};
    if (token) headers["x-admin-token"] = token;
    const url = filter === "all" ? "/api/transcripts" : `/api/transcripts?locale=${filter}`;
    setLoading(true);
    fetch(url, { headers })
      .then((r) => {
        if (r.status === 401) throw new Error("Unauthorized — ustaw admin token");
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
  }, []);

  useEffect(() => {
    fetchSessions(localeFilter, adminToken);
  }, [localeFilter, adminToken, fetchSessions]);

  const totalRated = sessions.reduce((acc, s) => acc + (s.metric?.totalFeedbackGiven ?? 0), 0);
  const totalTags = sessions.reduce(
    (acc, s) => acc + s.messages.reduce((a, m) => a + (m.reviewTags?.length ?? 0), 0),
    0
  );
  const totalSignals = sessions.reduce((acc, s) => acc + (s.behavioralSignals?.length ?? 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
        Ładowanie transcriptów...
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

  return (
    <div>
      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[
          { label: "Sesje łącznie", value: sessions.length },
          { label: "Ocenionych odpowiedzi", value: totalRated },
          { label: "Tagi reviewera", value: totalTags },
          { label: "Sygnały behawioralne", value: totalSignals },
          {
            label: "🇵🇱 PL / 🇬🇧 EN",
            value: `${sessions.filter((s) => s.sessionLocale === "pl").length} / ${sessions.filter((s) => s.sessionLocale === "en").length}`,
          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-xl font-semibold text-gray-800">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* PL vs EN comparison */}
      <LocaleComparison sessions={sessions} />

      {/* Locale filter tabs */}
      <div className="flex items-center border-b border-gray-200 mb-4">
        {([
          { key: "all" as LocaleFilter, label: "Wszystkie" },
          { key: "pl" as LocaleFilter, label: "🇵🇱 Polski Advisory" },
          { key: "en" as LocaleFilter, label: "🇬🇧 English Advisory" },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setLocaleFilter(key)}
            className={[
              "px-4 py-3 text-sm font-medium border-b-2 transition-colors",
              localeFilter === key
                ? "border-profitia-navy text-profitia-navy"
                : "border-transparent text-gray-400 hover:text-gray-600",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
        <button
          onClick={() => fetchSessions(localeFilter, adminToken)}
          className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition-colors px-3 pb-3"
        >
          ↻ Odśwież
        </button>
      </div>

      {/* Session list */}
      {sessions.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-12">Brak sesji evaluacyjnych.</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} adminToken={adminToken} />
          ))}
        </div>
      )}
    </div>
  );
}

