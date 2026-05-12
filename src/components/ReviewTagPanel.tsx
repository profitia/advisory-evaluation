"use client";

import { useState, useCallback } from "react";

interface Props {
  messageId: string;
  initialTags?: { tag: string; valence: string }[];
  adminToken?: string;
}

const POSITIVE_TAGS = [
  "human", "tactical", "useful", "realistic", "executive",
  "practical", "confident", "sharp",
] as const;

const NEGATIVE_TAGS = [
  "ai-sounding", "too-polished", "too-complete", "consulting-deck",
  "generic", "unrealistic", "overstructured", "too-safe",
  "enterprise-bot", "unnatural-empathy", "fake-authority", "artificial-certainty",
] as const;

type Tag = (typeof POSITIVE_TAGS)[number] | (typeof NEGATIVE_TAGS)[number];

function valenceOf(tag: string): "positive" | "negative" {
  return (POSITIVE_TAGS as readonly string[]).includes(tag) ? "positive" : "negative";
}

export default function ReviewTagPanel({ messageId, initialTags = [], adminToken }: Props) {
  const [activeTags, setActiveTags] = useState<Set<string>>(
    new Set(initialTags.map((t) => t.tag))
  );
  const [saving, setSaving] = useState<string | null>(null);

  const toggle = useCallback(
    async (tag: Tag) => {
      const isActive = activeTags.has(tag);
      const action = isActive ? "remove" : "add";

      // Optimistic update
      setActiveTags((prev) => {
        const next = new Set(prev);
        isActive ? next.delete(tag) : next.add(tag);
        return next;
      });
      setSaving(tag);

      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (adminToken) headers["x-admin-token"] = adminToken;

        await fetch("/api/review", {
          method: "POST",
          headers,
          body: JSON.stringify({
            type: "tag",
            messageId,
            tag,
            valence: valenceOf(tag),
            action,
          }),
        });
      } catch {
        // Rollback on failure
        setActiveTags((prev) => {
          const next = new Set(prev);
          isActive ? next.add(tag) : next.delete(tag);
          return next;
        });
      } finally {
        setSaving(null);
      }
    },
    [activeTags, messageId, adminToken]
  );

  return (
    <div className="mt-2 space-y-2">
      {/* Positive tags */}
      <div className="flex flex-wrap gap-1">
        {POSITIVE_TAGS.map((tag) => {
          const active = activeTags.has(tag);
          const busy = saving === tag;
          return (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              disabled={busy}
              className={[
                "px-2 py-0.5 rounded text-xs font-medium border transition-all",
                busy ? "opacity-40 cursor-wait" : "cursor-pointer",
                active
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-white border-emerald-200 text-emerald-700 hover:border-emerald-400",
              ].join(" ")}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Negative tags */}
      <div className="flex flex-wrap gap-1">
        {NEGATIVE_TAGS.map((tag) => {
          const active = activeTags.has(tag);
          const busy = saving === tag;
          return (
            <button
              key={tag}
              onClick={() => toggle(tag)}
              disabled={busy}
              className={[
                "px-2 py-0.5 rounded text-xs font-medium border transition-all",
                busy ? "opacity-40 cursor-wait" : "cursor-pointer",
                active
                  ? "bg-red-500 border-red-500 text-white"
                  : "bg-white border-red-200 text-red-600 hover:border-red-400",
              ].join(" ")}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Active tag count */}
      {activeTags.size > 0 && (
        <p className="text-xs text-gray-400">
          {activeTags.size} tag{activeTags.size > 1 ? "s" : ""} applied
        </p>
      )}
    </div>
  );
}
