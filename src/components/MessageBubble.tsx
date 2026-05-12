"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage } from "@/lib/types";
import FeedbackPanel from "./FeedbackPanel";

interface Props {
  message: ChatMessage;
  locale: "pl" | "en";
}

const PROFITIA_BASE = "https://profitia-pl.onrender.com";

// Rewrite relative paths to profitia-pl.onrender.com, open all links in new tab
function LinkRenderer({ href, children }: { href?: string; children?: React.ReactNode }) {
  let resolvedHref = href ?? "#";

  // Rewrite relative links to profitia base URL
  if (resolvedHref.startsWith("/")) {
    resolvedHref = PROFITIA_BASE + resolvedHref;
  }

  // Treat profitia.pl domain links as the onrender staging URL
  if (resolvedHref.includes("profitia.pl") && !resolvedHref.includes("onrender.com")) {
    const path = resolvedHref.replace(/https?:\/\/[^/]+/, "");
    resolvedHref = PROFITIA_BASE + path;
  }

  return (
    <a
      href={resolvedHref}
      target="_blank"
      rel="noopener noreferrer"
      className="text-profitia-blue underline underline-offset-2 hover:text-profitia-bright transition-colors"
    >
      {children}
    </a>
  );
}

export default function MessageBubble({ message, locale }: Props) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const isUser = message.role === "user";
  const isStreaming = message.isStreaming;

  return (
    <div className={`flex flex-col mb-4 ${isUser ? "items-end" : "items-start"}`}>
      {/* Message bubble */}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-profitia-navy text-white rounded-br-sm"
            : "bg-white border border-gray-100 shadow-sm text-gray-800 rounded-bl-sm"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            {message.content ? (
              <div className="prose-advisory">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children }) => (
                      <LinkRenderer href={href}>{children}</LinkRenderer>
                    ),
                    // No h1/h2/h3 in responses — treat as bold paragraph
                    h1: ({ children }) => <p className="font-semibold">{children}</p>,
                    h2: ({ children }) => <p className="font-semibold">{children}</p>,
                    h3: ({ children }) => <p className="font-medium">{children}</p>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <span className="text-gray-400 italic text-xs">
                {isStreaming ? (
                  <span className="flex gap-1 items-center">
                    <span className="w-1 h-1 bg-gray-300 rounded-full animate-pulse" />
                    <span className="w-1 h-1 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: "200ms" }} />
                    <span className="w-1 h-1 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: "400ms" }} />
                  </span>
                ) : "—"}
              </span>
            )}
          </>
        )}

        {/* Streaming cursor */}
        {!isUser && isStreaming && message.content && (
          <span className="inline-block w-0.5 h-3.5 bg-gray-400 ml-0.5 animate-pulse align-middle" />
        )}
      </div>

      {/* Interaction mode badge (assistant only) */}
      {!isUser && message.interactionMode && !isStreaming && (
        <span className="text-xs text-gray-400 mt-1 ml-1">
          {message.interactionMode}
        </span>
      )}

      {/* Feedback toggle (assistant only, after streaming done) */}
      {!isUser && !isStreaming && message.content && (
        <div className="mt-2 ml-1">
          {!feedbackSubmitted ? (
            <button
              onClick={() => setShowFeedback((v) => !v)}
              className="text-xs font-medium text-profitia-blue hover:text-profitia-navy transition-colors flex items-center gap-1.5 border border-profitia-blue/30 hover:border-profitia-blue/60 rounded-md px-2.5 py-1 bg-blue-50/50"
            >
              <span className="text-[10px]">{showFeedback ? "▲" : "▼"}</span>
              <span>
                {locale === "pl" ? "Oceń tę odpowiedź" : "Rate this response"}
              </span>
            </button>
          ) : (
            <span className="text-xs text-green-600">
              {locale === "pl" ? "Ocena zapisana — dziękujemy" : "Feedback saved — thank you"}
            </span>
          )}

          {showFeedback && !feedbackSubmitted && (
            <FeedbackPanel
              messageId={message.dbId}
              locale={locale}
              onSubmitted={() => {
                setFeedbackSubmitted(true);
                setShowFeedback(false);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
