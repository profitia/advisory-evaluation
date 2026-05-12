"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ChatMessage } from "@/lib/types";
import type { BehavioralSignalData } from "@/hooks/useBehavioralTelemetry";
import MessageBubble from "./MessageBubble";
import FeedbackPanel from "./FeedbackPanel";
import { getPlaceholderFromMessages } from "@/runtime/conversation-placeholder-engine";

interface Props {
  messages: ChatMessage[];
  onSend: (content: string) => void;
  onMessageMeta?: (content: string, signal: BehavioralSignalData) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  collectSignal?: (content: string) => BehavioralSignalData;
  isLoading: boolean;
  locale: "pl" | "en";
  sessionId: string | null;
}

const EMPTY_STATE = {
  pl: {
    title: "Procurement Advisory",
    subtitle: "Zadaj pytanie lub opisz sytuację. Może być po polsku lub po angielsku.",
    prompts: [
      "Dostawca grozi zerwaniem kontraktu",
      "Jak zbudować should-cost dla komponentów mechanicznych?",
      "Zarząd chce ograniczyć liczbę dostawców o 30%",
      "Negocjuję z monopolistą - co mam do czynienia?",
    ],
  },
  en: {
    title: "Procurement Advisory",
    subtitle: "Describe your situation. Polish or English - both work.",
    prompts: [
      "Supplier threatening to walk from the contract",
      "How to build a should-cost for mechanical components?",
      "Board wants to cut the supplier base by 30%",
      "Negotiating with a monopolist - what's my position?",
    ],
  },
};

export default function ChatWindow({ messages, onSend, onMessageMeta, onKeyDown, onPaste, collectSignal, isLoading, locale, sessionId }: Props) {
  const [input, setInput] = useState("");
  const [showSessionFeedback, setShowSessionFeedback] = useState(false);
  const [sessionFeedbackSubmitted, setSessionFeedbackSubmitted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const empty = EMPTY_STATE[locale];

  const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant" && !m.isStreaming);

  // ── Dynamic placeholder state ──────────────────────────────────────────────
  const usedPlaceholders = useRef<string[]>([]);
  const [dynamicPlaceholder, setDynamicPlaceholder] = useState<string>(
    () => getPlaceholderFromMessages([], locale, [])
  );
  const [placeholderKey, setPlaceholderKey] = useState(0);

  const advancePlaceholder = useCallback(() => {
    const next = getPlaceholderFromMessages(messages, locale, usedPlaceholders.current);
    usedPlaceholders.current = [...usedPlaceholders.current.slice(-2), next];
    setDynamicPlaceholder(next);
    setPlaceholderKey((k) => k + 1);
  }, [messages, locale]);

  // Update placeholder after each completed assistant message
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant" && !lastMsg.isStreaming) {
      advancePlaceholder();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, messages[messages.length - 1]?.isStreaming]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    // Collect behavioral signal before clearing input
    if (collectSignal && onMessageMeta) {
      const signal = collectSignal(trimmed);
      onMessageMeta(trimmed, signal);
    }
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    onSend(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Forward to telemetry handler first
    onKeyDown?.(e);
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    onPaste?.(e);
  };

  return (
    <div className="flex flex-col w-full max-w-2xl px-4">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center pt-16 pb-8">
            <div className="mb-2">
              <div className="w-10 h-10 rounded-full bg-profitia-navy flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-sm font-semibold">P</span>
              </div>
              <h2 className="text-base font-semibold text-gray-800">{empty.title}</h2>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">{empty.subtitle}</p>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-2 w-full max-w-md">
              {empty.prompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onSend(prompt)}
                  className="text-left px-4 py-2.5 rounded-lg border border-gray-200 bg-white hover:border-profitia-blue hover:bg-blue-50 text-sm text-gray-700 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              locale={locale}
            />
          ))
        )}

        {/* Loading indicator */}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-2 px-2 py-3">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="py-4 border-t border-gray-100">
        <div className="flex items-end gap-2 bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 focus-within:border-profitia-blue focus-within:ring-1 focus-within:ring-profitia-blue transition-all">
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder=""
              rows={1}
              disabled={isLoading}
              className="w-full resize-none bg-transparent text-sm text-gray-800 outline-none disabled:opacity-50 min-h-[24px] max-h-[160px]"
            />
            {!input && (
              <span
                key={placeholderKey}
                className="placeholder-fade absolute top-0 left-0 text-sm text-gray-400 pointer-events-none select-none whitespace-nowrap overflow-hidden max-w-full"
              >
                {dynamicPlaceholder}
              </span>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-profitia-navy hover:bg-profitia-blue disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
            aria-label="Wyślij"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          {locale === "pl" ? "Enter - wyślij · Shift+Enter - nowa linia" : "Enter to send · Shift+Enter for new line"}
        </p>
        {sessionId && !sessionId.startsWith("offline-") && (
          <p className="text-center text-xs text-gray-300 mt-0.5">
            session {sessionId.slice(0, 8)}
          </p>
        )}

        {/* Session-level feedback — visible once there are messages */}
        {messages.length > 0 && !isLoading && (
          <div className="mt-4 border-t border-gray-100 pt-3">
            {!sessionFeedbackSubmitted ? (
              <>
                <button
                  onClick={() => setShowSessionFeedback((v) => !v)}
                  className="w-full text-xs font-medium text-profitia-blue hover:text-profitia-navy transition-colors flex items-center justify-center gap-1.5 border border-profitia-blue/30 hover:border-profitia-blue/60 rounded-lg px-3 py-2 bg-blue-50/50"
                >
                  <span className="text-[10px]">{showSessionFeedback ? "▲" : "▼"}</span>
                  <span>{locale === "pl" ? "Oceń tę konwersację" : "Rate this conversation"}</span>
                </button>
                {showSessionFeedback && (
                  <FeedbackPanel
                    messageId={lastAssistantMsg?.dbId}
                    locale={locale}
                    onSubmitted={() => {
                      setSessionFeedbackSubmitted(true);
                      setShowSessionFeedback(false);
                    }}
                  />
                )}
              </>
            ) : (
              <p className="text-center text-xs text-green-600 py-1">
                {locale === "pl" ? "Ocena zapisana - dziękujemy" : "Feedback saved - thank you"}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
