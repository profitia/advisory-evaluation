"use client";

import { useEffect, useState } from "react";
import type { TranscriptSession, TranscriptMessage } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  adminToken?: string;
}

type LocaleFilter = "all" | "pl" | "en";

function fmt(date: string) {
  return new Date(date).toLocaleString("pl-PL", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function avgBadge(value: number | null | undefined) {
  if (value === null || value === undefined) return <span className="text-gray-300">—</span>;
  const color = value >= 4 ? "text-green-600" : value >= 3 ? "text-amber-600" : "text-red-500";
  return <span className={`font-semibold ${color}`}>{value.toFixed(2)}</span>;
}

function RatingRow({ label, value }: { label: string; value: number | null }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500 w-40 shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`w-4 h-4 rounded text-xs flex items-center justify-center ${
              n <= value ? "bg-profitia-navy text-white" : "bg-gray-100 text-gray-300"
            }`}
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}

function FeedbackBlock({ feedback }: { feedback: TranscriptMessage["feedback"] }) {
  if (!feedback) return <span className="text-xs text-gray-300 italic">Brak oceny</span>;

  const hasText = [
    feedback.whatWasUnnatural, feedback.whatWasValuable, feedback.whatSoundedAI,
    feedback.tooConsulting, feedback.tooLong, feedback.tooConfident, feedback.freeComment,
  ].some(Boolean);

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1.5">
      <RatingRow label="Naturalność" value={feedback.naturalness} />
      <RatingRow label="Adekwatność" value={feedback.adequacy} />
      <RatingRow label="Praktyczność" value={feedback.practicality} />
      <RatingRow label="Brzmi jak praktyk?" value={feedback.practitionerFeel} />
      <RatingRow label="Poziom zaufania" value={feedback.trustLevel} />
      {hasText && (
        <div className="mt-2 pt-2 border-t border-gray-200 space-y-1.5 text-xs">
          {feedback.whatWasValuable && (
            <p><span className="text-green-600 font-medium">Wartościowe: </span><span className="text-gray-600">{feedback.whatWasValuable}</span></p>
          )}
          {feedback.whatWasUnnatural && (
            <p><span className="text-amber-600 font-medium">Nienaturalne: </span><span className="text-gray-600">{feedback.whatWasUnnatural}</span></p>
          )}
          {feedback.whatSoundedAI && (
            <p><span className="text-red-500 font-medium">AI tone: </span><span className="text-gray-600">{feedback.whatSoundedAI}</span></p>
          )}
          {feedback.tooConsulting && (
            <p><span className="text-orange-500 font-medium">Zbyt konsultingowe: </span><span className="text-gray-600">{feedback.tooConsulting}</span></p>
          )}
          {feedback.tooLong && (
            <p><span className="text-gray-500 font-medium">Zbyt długie: </span><span className="text-gray-600">{feedback.tooLong}</span></p>
          )}
          {feedback.tooConfident && (
            <p><span className="text-gray-500 font-medium">Zbyt pewne: </span><span className="text-gray-600">{feedback.tooConfident}</span></p>
          )}
          {feedback.freeComment && (
            <p><span className="text-gray-500 font-medium">Komentarz: </span><span className="text-gray-600">{feedback.freeComment}</span></p>
          )}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session }: { session: TranscriptSession }) {
  const [expanded, setExpanded] = useState(false);
  const assistantMessages = session.messages.filter((m) => m.role === "assistant");
  const feedbackCount = assistantMessages.filter((m) => m.feedback).length;
  const localeFlag = session.sessionLocale === "pl" ? "🇵🇱" : "🇬🇧";
  const localeName = session.sessionLocale === "pl" ? "Polski Advisory" : "English Advisory";

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{localeFlag}</span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-800">{fmt(session.createdAt)}</p>
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 rounded text-gray-500">{localeName}</span>
              {session.userSwitchedLocale && (
                <span className="text-xs px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-amber-600">przełączona</span>
              )}
            </div>
            {session.testerNote && (
              <p className="text-xs text-gray-500 mt-0.5">{session.testerNote}</p>
            )}
          </div>
          <span className="text-xs text-gray-400">
            {session.messages.length} wiad. · {feedbackCount}/{assistantMessages.length} ocenionych
          </span>
        </div>

        <div className="flex items-center gap-4">
          {session.metric && (
            <div className="flex gap-3 text-xs text-gray-500">
              <span>Naturalność {avgBadge(session.metric.avgNaturalness)}</span>
              <span>Praktyk {avgBadge(session.metric.avgPractitionerFeel)}</span>
              <span>Zaufanie {avgBadge(session.metric.avgTrustLevel)}</span>
            </div>
          )}
          <span className="text-gray-400 text-sm">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {session.messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-400">{fmt(msg.createdAt)}</span>
                {msg.interactionMode && (
                  <span className="text-xs text-gray-300">· {msg.interactionMode}</span>
                )}
              </div>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === "user"
                    ? "bg-profitia-navy text-white rounded-br-sm"
                    : "bg-gray-50 border border-gray-100 text-gray-800 rounded-bl-sm"
                }`}
              >
                {msg.role === "user" ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="prose-advisory">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
              {msg.role === "assistant" && (
                <div className="mt-1 w-full max-w-[85%]">
                  <FeedbackBlock feedback={msg.feedback} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Per-locale aggregate stats ────────────────────────────

function LocaleStats({ sessions }: { sessions: TranscriptSession[] }) {
  const getAvgs = (locale: "pl" | "en") => {
    const locSessions = sessions.filter((s) => s.sessionLocale === locale);
    const allMsgs = locSessions.flatMap((s) => s.messages.filter((m) => m.role === "assistant" && m.feedback));

    const avg = (vals: (number | null)[]): number | null => {
      const nums = vals.filter((v): v is number => v !== null);
      return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    };

    return {
      sessions: locSessions.length,
      rated: allMsgs.filter((m) => m.feedback).length,
      naturalness: avg(allMsgs.map((m) => m.feedback?.naturalness ?? null)),
      practicality: avg(allMsgs.map((m) => m.feedback?.practicality ?? null)),
      practitionerFeel: avg(allMsgs.map((m) => m.feedback?.practitionerFeel ?? null)),
      trustLevel: avg(allMsgs.map((m) => m.feedback?.trustLevel ?? null)),
      switched: locSessions.filter((s) => s.userSwitchedLocale).length,
    };
  };

  const pl = getAvgs("pl");
  const en = getAvgs("en");

  if (pl.sessions === 0 && en.sessions === 0) return null;

  const Row = ({ label, pl: p, en: e }: { label: string; pl: number | null; en: number | null }) => (
    <tr className="border-t border-gray-100">
      <td className="py-2 pr-4 text-xs text-gray-500">{label}</td>
      <td className="py-2 pr-4 text-xs text-center">{avgBadge(p)}</td>
      <td className="py-2 text-xs text-center">{avgBadge(e)}</td>
    </tr>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Porównanie PL vs EN</h3>
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left text-xs text-gray-400 pb-2 font-normal">Kryterium</th>
            <th className="text-center text-xs pb-2 font-medium text-gray-600">🇵🇱 Polski ({pl.sessions} sesji)</th>
            <th className="text-center text-xs pb-2 font-medium text-gray-600">🇬🇧 English ({en.sessions} sesji)</th>
          </tr>
        </thead>
        <tbody>
          <Row label="Ocenionych odpowiedzi" pl={pl.rated} en={en.rated} />
          <Row label="Naturalność" pl={pl.naturalness} en={en.naturalness} />
          <Row label="Praktyczność" pl={pl.practicality} en={en.practicality} />
          <Row label="Brzmi jak praktyk" pl={pl.practitionerFeel} en={en.practitionerFeel} />
          <Row label="Poziom zaufania" pl={pl.trustLevel} en={en.trustLevel} />
          <Row label="Przełączonych sesji" pl={pl.switched} en={en.switched} />
        </tbody>
      </table>
    </div>
  );
}

export default function AdminTranscriptView({ adminToken }: Props) {
  const [sessions, setSessions] = useState<TranscriptSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localeFilter, setLocaleFilter] = useState<LocaleFilter>("all");

  const fetchSessions = (filter: LocaleFilter, token?: string) => {
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
  };

  useEffect(() => {
    fetchSessions(localeFilter, adminToken);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localeFilter, adminToken]);

  const allSessions = sessions;
  const totalRated = allSessions.reduce((acc, s) => acc + (s.metric?.totalFeedbackGiven ?? 0), 0);

  const allFeedback = (l?: "pl" | "en") =>
    sessions
      .filter((s) => !l || s.sessionLocale === l)
      .flatMap((s) => s.messages.filter((m) => m.feedback));

  const globalAvgN = (arr: TranscriptMessage[]) => {
    const vals = arr.map((m) => m.feedback?.naturalness).filter((v): v is number => v != null);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : "—";
  };

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
      {/* Global summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Sesje łącznie", value: allSessions.length },
          { label: "Ocenionych odpowiedzi", value: totalRated },
          { label: "🇵🇱 PL sessions", value: allSessions.filter((s) => s.sessionLocale === "pl").length },
          { label: "🇬🇧 EN sessions", value: allSessions.filter((s) => s.sessionLocale === "en").length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-semibold text-gray-800">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* PL vs EN comparison table */}
      <LocaleStats sessions={allSessions} />

      {/* Locale filter tabs */}
      <div className="flex items-center gap-0 mb-4 border-b border-gray-200">
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
        <div className="ml-auto pb-3">
          <button
            onClick={() => fetchSessions(localeFilter, adminToken)}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-3"
          >
            ↻ Odśwież
          </button>
        </div>
      </div>

      {/* Session list */}
      {sessions.length === 0 ? (
        <p className="text-center text-gray-400 text-sm py-12">Brak sesji evaluacyjnych.</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      )}
    </div>
  );
}
