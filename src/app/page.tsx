"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { nanoid } from "nanoid";
import type { ChatMessage } from "@/lib/types";
import { useBehavioralTelemetry } from "@/hooks/useBehavioralTelemetry";
import ChatWindow from "@/components/ChatWindow";
import EvalSidebar from "@/components/EvalSidebar";

type Locale = "pl" | "en";

const MODE_LABELS: Record<Locale, { tab: string; flag: string; badge: string }> = {
  pl: { tab: "Polski Advisory", flag: "🇵🇱", badge: "PL" },
  en: { tab: "English Advisory", flag: "🇬🇧", badge: "EN" },
};

async function createSession(locale: Locale, switched: boolean): Promise<string | null> {
  try {
    const res = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, userSwitchedLocale: switched }),
    });
    const data = await res.json() as { sessionId?: string };
    return data.sessionId ?? null;
  } catch {
    return null;
  }
}

export default function EvaluationPage() {
  const [locale, setLocale] = useState<Locale>("pl");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const isFirstMount = useRef(true);

  const telemetry = useBehavioralTelemetry();

  // Create initial session on mount
  useEffect(() => {
    createSession("pl", false).then((id) => {
      if (id) {
        setSessionId(id);
      } else {
        setSessionError(true);
        setSessionId("offline-" + nanoid(8));
      }
    });
  }, []);

  // Switch locale — creates a NEW isolated session, clears transcript
  const switchLocale = useCallback(async (next: Locale) => {
    if (next === locale) return;

    // Immediately clear UI — new session
    setMessages([]);
    setIsLoading(false);
    setLocale(next);

    const newId = await createSession(next, !isFirstMount.current);
    isFirstMount.current = false;

    if (newId) {
      setSessionId(newId);
      setSessionError(false);
    } else {
      setSessionError(true);
      setSessionId("offline-" + nanoid(8));
    }
  }, [locale]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoading || !content.trim()) return;

      const userMessage: ChatMessage = { id: nanoid(), role: "user", content };
      const assistantId = nanoid();
      const assistantPlaceholder: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
      setIsLoading(true);

      const historyForAPI = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: historyForAPI,
            locale,
            sessionId: sessionId?.startsWith("offline-") ? null : sessionId,
          }),
        });

        if (!response.ok || !response.body) throw new Error("Stream failed");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") {
              setMessages((prev) =>
                prev.map((m) => m.id === assistantId ? { ...m, isStreaming: false } : m)
              );
              setIsLoading(false);
              // Notify telemetry that assistant message is complete
              telemetry.onAssistantComplete();
              break;
            }

            try {
              const event = JSON.parse(raw) as { type: string; content?: string; messageId?: string };

              if (event.type === "text" && event.content) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + event.content! }
                      : m
                  )
                );
              } else if (event.type === "message_saved" && event.messageId) {
                setMessages((prev) =>
                  prev.map((m) => m.id === assistantId ? { ...m, dbId: event.messageId } : m)
                );
              }
            } catch {
              // Malformed SSE — skip
            }
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: locale === "pl"
                    ? "Wystąpił błąd podczas łączenia z serwerem. Spróbuj ponownie."
                    : "Connection error. Please try again.",
                  isStreaming: false,
                }
              : m
          )
        );
        setIsLoading(false);
      }
    },
    [isLoading, messages, locale, sessionId, telemetry]
  );

  // Handle behavioral metadata fired by ChatWindow before onSend
  const handleMessageMeta = useCallback(
    (content: string, signal: Parameters<typeof telemetry.sendSignal>[1]) => {
      if (!sessionId) return;
      void telemetry.sendSignal(sessionId, signal);
    },
    [sessionId, telemetry]
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left: sidebar 1/3 */}
      <EvalSidebar />

      {/* Right: chat panel 2/3 */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-0 flex items-center justify-between shrink-0">
          {/* Test mode tabs */}
          <div className="flex items-end gap-0">
            {(["pl", "en"] as Locale[]).map((l) => {
              const active = locale === l;
              const { tab, flag } = MODE_LABELS[l];
              return (
                <button
                  key={l}
                  onClick={() => switchLocale(l)}
                  disabled={isLoading}
                  className={[
                    "relative flex items-center gap-2 px-5 py-4 text-sm font-medium transition-all border-b-2 disabled:cursor-not-allowed",
                    active
                      ? "border-profitia-navy text-profitia-navy bg-white"
                      : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200",
                  ].join(" ")}
                >
                  <span>{flag}</span>
                  <span>{tab}</span>
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-profitia-navy" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right side: session info + offline badge */}
          <div className="flex items-center gap-3">
            {sessionError && (
              <span className="text-xs text-amber-500">offline mode</span>
            )}
            <span className="text-xs text-gray-300 font-mono">
              {locale.toUpperCase()}
              {sessionId && !sessionId.startsWith("offline-")
                ? ` · ${sessionId.slice(0, 8)}`
                : ""}
            </span>
            <span className="text-xs text-gray-300">ETAP 8.5</span>
          </div>
        </header>

        {/* Locale switch notice */}
        {messages.length === 0 && !isFirstMount.current && (
          <div className="text-center py-2 bg-blue-50 border-b border-blue-100 shrink-0">
            <p className="text-xs text-blue-600">
              {locale === "pl"
                ? "Nowa sesja — Polski Advisory. Poprzedni transcript zapisany."
                : "New session — English Advisory. Previous transcript saved."}
            </p>
          </div>
        )}

        {/* Chat */}
        <main className="flex-1 overflow-hidden flex justify-center">
          <ChatWindow
            messages={messages}
            onSend={sendMessage}
            onMessageMeta={handleMessageMeta}
            onKeyDown={telemetry.onKeyDown}
            onPaste={telemetry.onPaste}
            collectSignal={telemetry.collectSignal}
            isLoading={isLoading}
            locale={locale}
            sessionId={sessionId}
          />
        </main>
      </div>

    </div>
  );
}
