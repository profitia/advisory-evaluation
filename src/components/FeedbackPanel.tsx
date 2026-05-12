"use client";

import { useState } from "react";
import type { FeedbackRatings, FeedbackText } from "@/lib/types";
import clsx from "clsx";

interface Props {
  messageId?: string;  // undefined if DB offline
  locale: "pl" | "en";
  onSubmitted: () => void;
}

const RATINGS = [
  { key: "naturalness" as const, labelPL: "Naturalność rozmowy", labelEN: "Conversational naturalness" },
  { key: "adequacy" as const, labelPL: "Adekwatność odpowiedzi", labelEN: "Response adequacy" },
  { key: "practicality" as const, labelPL: "Poziom praktyczności", labelEN: "Practicality level" },
  { key: "practitionerFeel" as const, labelPL: "Brzmi jak praktyk procurement?", labelEN: "Sounds like a procurement practitioner?" },
  { key: "trustLevel" as const, labelPL: "Poziom zaufania do odpowiedzi", labelEN: "Trust in this response" },
];

const TEXT_FIELDS = [
  { key: "whatWasUnnatural" as const, labelPL: "Co brzmiało nienaturalnie?", labelEN: "What sounded unnatural?" },
  { key: "whatWasValuable" as const, labelPL: "Co było najbardziej wartościowe?", labelEN: "What was most valuable?" },
  { key: "whatSoundedAI" as const, labelPL: "Co brzmiało jak AI/bot?", labelEN: "What sounded like AI/bot?" },
  { key: "tooConsulting" as const, labelPL: "Co było zbyt konsultingowe?", labelEN: "What was too consulting-like?" },
  { key: "tooLong" as const, labelPL: "Co było zbyt długie?", labelEN: "What was too long?" },
  { key: "tooConfident" as const, labelPL: "Co było zbyt pewne siebie?", labelEN: "What was overconfident?" },
  { key: "freeComment" as const, labelPL: "Dowolny komentarz", labelEN: "Any other comments", isLarge: true },
];

function StarRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs text-gray-600 flex-1">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={clsx(
              "w-7 h-7 rounded text-xs font-medium transition-all border",
              value === n
                ? "bg-profitia-navy text-white border-profitia-navy"
                : "bg-white text-gray-400 border-gray-200 hover:border-profitia-blue hover:text-profitia-blue"
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FeedbackPanel({ messageId, locale, onSubmitted }: Props) {
  const [ratings, setRatings] = useState<FeedbackRatings>({});
  const [text, setText] = useState<FeedbackText>({});
  const [showTextFields, setShowTextFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setRating = (key: keyof FeedbackRatings, value: number) => {
    setRatings((prev) => ({ ...prev, [key]: value }));
  };

  const setText_ = (key: keyof FeedbackText, value: string) => {
    setText((prev) => ({ ...prev, [key]: value }));
  };

  const hasAnyRating = Object.values(ratings).some((v) => v !== undefined);

  const handleSubmit = async () => {
    if (!hasAnyRating) {
      setError(locale === "pl" ? "Ocena co najmniej jednego kryterium jest wymagana." : "Rate at least one criterion.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      messageId: messageId ?? "offline",
      ...ratings,
      ...text,
    };

    if (!messageId) {
      // Offline mode — log locally and complete
      console.info("[Advisory Eval] Offline feedback:", payload);
      setTimeout(() => {
        setIsSubmitting(false);
        onSubmitted();
      }, 400);
      return;
    }

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");
      onSubmitted();
    } catch {
      setError(locale === "pl" ? "Błąd zapisu. Spróbuj ponownie." : "Save error. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-2 p-3 bg-gray-50 border border-gray-100 rounded-xl w-full max-w-md">
      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
        {locale === "pl" ? "Ocena odpowiedzi" : "Response rating"}
      </p>

      {/* Rating rows */}
      <div className="divide-y divide-gray-100">
        {RATINGS.map(({ key, labelPL, labelEN }) => (
          <StarRow
            key={key}
            label={locale === "pl" ? labelPL : labelEN}
            value={ratings[key]}
            onChange={(v) => setRating(key, v)}
          />
        ))}
      </div>

      {/* Optional text fields toggle */}
      <button
        type="button"
        onClick={() => setShowTextFields((v) => !v)}
        className="mt-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        {showTextFields
          ? locale === "pl" ? "▲ Ukryj pola tekstowe" : "▲ Hide text fields"
          : locale === "pl" ? "▼ Dodaj komentarz (opcjonalnie)" : "▼ Add comments (optional)"}
      </button>

      {showTextFields && (
        <div className="mt-3 space-y-2">
          {TEXT_FIELDS.map(({ key, labelPL, labelEN, isLarge }) => (
            <div key={key}>
              <label className="text-xs text-gray-500 block mb-0.5">
                {locale === "pl" ? labelPL : labelEN}
              </label>
              <textarea
                value={text[key] ?? ""}
                onChange={(e) => setText_(key, e.target.value)}
                rows={isLarge ? 3 : 2}
              className="w-full text-[16px] md:text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 placeholder-gray-300 resize-none outline-none focus:border-profitia-blue transition-colors"
                placeholder={locale === "pl" ? "Opcjonalnie..." : "Optional..."}
              />
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="mt-3 w-full py-2 bg-profitia-navy hover:bg-profitia-blue disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors"
      >
        {isSubmitting
          ? locale === "pl" ? "Zapisywanie..." : "Saving..."
          : locale === "pl" ? "Zapisz ocenę" : "Submit rating"}
      </button>
    </div>
  );
}
