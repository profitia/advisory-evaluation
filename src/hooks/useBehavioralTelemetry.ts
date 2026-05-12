// Behavioral telemetry hook — tracks message drafting signals.
// Collected entirely client-side; sent to /api/behavioral after message submit.
// Non-critical: failures are silent. Never blocks the main chat flow.

import { useRef, useCallback } from "react";
import { estimateEmotionalState } from "@/lib/emotionalEstimator";

export interface BehavioralSignalData {
  draftDurationMs?: number;
  responseLatencyMs?: number;
  backspaceCount?: number;
  pastedChars?: number;
  deletedChars?: number;
  finalLength?: number;
  hesitationMs?: number;
  emotionalState?: string;
}

export function useBehavioralTelemetry() {
  const firstKeystrokeAt = useRef<number | null>(null);
  const lastKeystrokeAt = useRef<number | null>(null);
  const lastAssistantCompleteAt = useRef<number | null>(null);
  const backspaceCount = useRef(0);
  const pastedChars = useRef(0);
  const deletedChars = useRef(0);

  const reset = useCallback(() => {
    firstKeystrokeAt.current = null;
    lastKeystrokeAt.current = null;
    backspaceCount.current = 0;
    pastedChars.current = 0;
    deletedChars.current = 0;
  }, []);

  // Call when a new assistant message finishes streaming
  const onAssistantComplete = useCallback(() => {
    lastAssistantCompleteAt.current = Date.now();
    reset();
  }, [reset]);

  // Forward this to textarea onKeyDown
  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const now = Date.now();
    if (!firstKeystrokeAt.current) firstKeystrokeAt.current = now;
    lastKeystrokeAt.current = now;
    if (e.key === "Backspace" || e.key === "Delete") {
      backspaceCount.current++;
      deletedChars.current++;
    }
  }, []);

  // Forward this to textarea onPaste
  const onPaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text");
    pastedChars.current += text.length;
  }, []);

  // Call right before submitting a message to collect the full signal
  const collectSignal = useCallback((messageContent: string): BehavioralSignalData => {
    const submitAt = Date.now();

    const draftDurationMs = firstKeystrokeAt.current
      ? submitAt - firstKeystrokeAt.current
      : undefined;

    const responseLatencyMs =
      lastAssistantCompleteAt.current && firstKeystrokeAt.current
        ? firstKeystrokeAt.current - lastAssistantCompleteAt.current
        : undefined;

    const hesitationMs = lastKeystrokeAt.current
      ? Math.max(0, submitAt - lastKeystrokeAt.current)
      : undefined;

    const emotionalState = estimateEmotionalState(messageContent);

    return {
      draftDurationMs,
      responseLatencyMs,
      backspaceCount: backspaceCount.current > 0 ? backspaceCount.current : undefined,
      pastedChars: pastedChars.current > 0 ? pastedChars.current : undefined,
      deletedChars: deletedChars.current > 0 ? deletedChars.current : undefined,
      finalLength: messageContent.length,
      hesitationMs,
      emotionalState,
    };
  }, []);

  // Fire-and-forget send to /api/behavioral
  const sendSignal = useCallback(
    async (sessionId: string, signal: BehavioralSignalData, messageId?: string) => {
      if (sessionId.startsWith("offline-")) return;
      try {
        await fetch("/api/behavioral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, messageId, ...signal }),
        });
      } catch {
        // Telemetry is non-critical — never throw
      }
    },
    []
  );

  return { onKeyDown, onPaste, collectSignal, sendSignal, reset, onAssistantComplete };
}
