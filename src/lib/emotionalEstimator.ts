// Lightweight heuristic emotional state estimation.
// No AI, no sentiment model — pure signal pattern matching.
// Per-user-turn. Purpose: understand if assistant changes emotional trajectory.

export type EmotionalState =
  | "stressed"
  | "skeptical"
  | "analytical"
  | "rushed"
  | "frustrated"
  | "calm"
  | "exploratory";

const PATTERNS: Record<Exclude<EmotionalState, "rushed" | "calm">, { pl: string[]; en: string[] }> = {
  stressed: {
    pl: ["pilne", "szybko", "deadline", "kryzys", "awaria", "poważne", "natychmiast", "pomocy", "nie wiem co robić", "musimy", "jutro"],
    en: ["urgent", "asap", "crisis", "deadline", "emergency", "critical", "help", "immediately", "we need", "tomorrow"],
  },
  skeptical: {
    pl: ["ale", "jednak", "nie wiem czy", "czy to zadziała", "realnie", "nie jestem przekonany", "wątpię", "naprawdę?", "na pewno?", "serio?"],
    en: ["but", "however", "not sure if", "will it work", "really", "doubt", "unlikely", "are you sure", "seriously", "actually"],
  },
  analytical: {
    pl: ["analiz", "dane", "model", "procent", "kalkul", "struktur", "metodol", "framework", "porównaj", "benchmark", "warianty", "scenariusz"],
    en: ["analys", "data", "model", "percent", "calculat", "structure", "methodol", "framework", "compare", "benchmark", "scenarios", "variants"],
  },
  frustrated: {
    pl: ["nie rozumiem", "to nie działa", "bez sensu", "niemożliwe", "ciągle", "znowu", "kolejny raz", "za każdym razem", "irytuj", "zmęczony"],
    en: ["don't understand", "doesn't work", "makes no sense", "impossible", "keep", "again", "every time", "annoying", "tired of", "frustrat"],
  },
  exploratory: {
    pl: ["co Pan sądzi", "jak Pan ocenia", "czy warto", "jakie są opcje", "co byś", "co Pan radzi", "zastanawiam się", "jak podejść", "od czego zacząć"],
    en: ["what do you think", "how would you", "what are the options", "what should i", "wondering", "how to approach", "where to start", "your thoughts", "any advice"],
  },
};

export function estimateEmotionalState(text: string): EmotionalState {
  const lower = text.toLowerCase();
  const length = text.trim().length;

  // Rushed: very short, no question mark (not asking — just pushing through)
  if (length < 22 && !lower.includes("?")) return "rushed";

  const scores: Partial<Record<EmotionalState, number>> = {};

  for (const [state, { pl, en }] of Object.entries(PATTERNS) as [EmotionalState, { pl: string[]; en: string[] }][]) {
    let score = 0;
    for (const kw of [...pl, ...en]) {
      if (lower.includes(kw)) score++;
    }
    scores[state] = score;
  }

  // Analytical boost for structured text
  if (length > 200) scores.analytical = (scores.analytical ?? 0) + 1;
  if (/\d+[\s%]/.test(text)) scores.analytical = (scores.analytical ?? 0) + 1;
  if (/\n|^\d\.|^-\s/m.test(text)) scores.analytical = (scores.analytical ?? 0) + 1;

  const topEntry = Object.entries(scores).sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))[0];
  if (topEntry && (topEntry[1] ?? 0) > 0) return topEntry[0] as EmotionalState;

  // Default by length
  return length > 80 ? "analytical" : "calm";
}

export const EMOTIONAL_STATE_LABELS: Record<EmotionalState, { label: string; color: string }> = {
  stressed:    { label: "stressed",    color: "text-red-500 bg-red-50 border-red-100" },
  skeptical:   { label: "skeptical",   color: "text-amber-600 bg-amber-50 border-amber-100" },
  analytical:  { label: "analytical",  color: "text-blue-600 bg-blue-50 border-blue-100" },
  rushed:      { label: "rushed",      color: "text-orange-500 bg-orange-50 border-orange-100" },
  frustrated:  { label: "frustrated",  color: "text-red-600 bg-red-50 border-red-100" },
  calm:        { label: "calm",        color: "text-green-600 bg-green-50 border-green-100" },
  exploratory: { label: "exploratory", color: "text-violet-600 bg-violet-50 border-violet-100" },
};
