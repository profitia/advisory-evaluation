// ─────────────────────────────────────────────────────────────────────────────
// ETAP UX-CONV-1 — Dynamic Conversational Placeholder Engine
// Conversational UX layer only. Does NOT touch ETAP 8.5 runtime or scoring.
// ─────────────────────────────────────────────────────────────────────────────

import type { InteractionMode } from "./interaction-mode-router";
import type { ChatMessage } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ConversationStage =
  | "cold_start"
  | "discovery"
  | "negotiation"
  | "should_cost"
  | "executive"
  | "supplier_conflict"
  | "escalation"
  | "followup"
  | "clarification"
  | "emotional_pressure";

export interface PlaceholderInput {
  conversationStage: ConversationStage;
  interactionMode?: InteractionMode;
  locale: "pl" | "en";
  messageCount: number;
  recentlyUsed?: string[];
}

// ── Placeholder pools ─────────────────────────────────────────────────────────
// Deliberatly asymmetric, conversational, sometimes incomplete.
// NOT: "Wpisz wiadomość…" / "Opisz problem…"
// YES: "To była ich pierwsza oferta?" / "Jak zareagował dostawca?"

const POOL: Record<ConversationStage, { pl: string[]; en: string[] }> = {
  cold_start: {
    pl: [
      "Opisz sytuację z dostawcą lub negocjacją…",
      "Co dzieje się teraz w zakupach?",
      "Z czym jest największy problem?",
      "Jaki scenariusz zakupowy Cię dotyczy?",
      "Co konkretnie się dzieje — zacznijmy od kontekstu.",
    ],
    en: [
      "Describe your supplier situation or negotiation…",
      "What's happening in procurement right now?",
      "What's the biggest challenge?",
      "Walk me through the situation.",
      "What are you dealing with?",
    ],
  },

  discovery: {
    pl: [
      "Co jeszcze powinienem wiedzieć?",
      "Jaki jest kontekst po stronie biznesu?",
      "Od kiedy trwa ta sytuacja?",
      "Kto jest zaangażowany po stronie dostawcy?",
      "Co zrobiliście do tej pory?",
      "Jaki jest główny cel tej negocjacji?",
      "Kontekst relacji z dostawcą…",
      "Argumentacja biznesu…",
    ],
    en: [
      "What else should I know?",
      "What's the business side saying?",
      "How long has this been going on?",
      "Who's involved on the supplier side?",
      "What have you tried so far?",
      "What's the main goal here?",
      "Business context…",
      "Supplier relationship background…",
    ],
  },

  negotiation: {
    pl: [
      "Co odpowiedział dostawca?",
      "Jak wygląda ich argumentacja?",
      "To była ich pierwsza oferta?",
      "Jak zareagowali na Waszą propozycję?",
      "Co mówią o powodach podwyżki?",
      "Ile realnie możecie przenieść?",
      "Jaki jest Wasz plan B?",
      "Macie alternatywę?",
      "Jak mocna jest ich pozycja?",
    ],
    en: [
      "What did the supplier say?",
      "How are they justifying it?",
      "Was that their first offer?",
      "How did they respond to your proposal?",
      "What's their reasoning for the increase?",
      "How much volume could you realistically move?",
      "What's your plan B?",
      "Do you have an alternative?",
      "How strong is their position?",
    ],
  },

  should_cost: {
    pl: [
      "Jakie dane kosztowe już macie?",
      "Znacie strukturę materiałową?",
      "Jak wygląda wolumen?",
      "Wiecie jaki mają udział robocizny?",
      "Macie benchmarki rynkowe?",
      "Co wchodzi w skład kosztu?",
      "Gdzie jest największa niepewność kosztowa?",
    ],
    en: [
      "What cost data do you already have?",
      "Do you know the material breakdown?",
      "What does the volume look like?",
      "Do you know their labor share?",
      "Do you have market benchmarks?",
      "What goes into the cost structure?",
      "Where's the biggest cost uncertainty?",
    ],
  },

  executive: {
    pl: [
      "Jaka decyzja musi zapaść?",
      "Gdzie jest największa presja?",
      "Co jest największym ryzykiem?",
      "Ile czasu masz na decyzję?",
      "Co mówi zarząd?",
      "Jakie są opcje na stole?",
      "Presja po stronie operacji…",
      "Co by zaakceptował board?",
    ],
    en: [
      "What decision needs to be made?",
      "Where's the biggest pressure coming from?",
      "What's the main risk here?",
      "How much time do you have?",
      "What's the board saying?",
      "What options are on the table?",
      "Operational pressure…",
      "What would the board accept?",
    ],
  },

  supplier_conflict: {
    pl: [
      "Jak mocno jesteście zależni?",
      "Macie alternatywę?",
      "Co mówi biznes?",
      "Ile czasu zajęłaby zmiana dostawcy?",
      "Kiedy zaczął się ten konflikt?",
      "Był jakiś incident, który to uruchomił?",
      "Jak wygląda historia relacji z tym dostawcą?",
    ],
    en: [
      "How dependent are you on them?",
      "Do you have an alternative?",
      "What's the business side saying?",
      "How long would switching actually take?",
      "When did this conflict start?",
      "Was there a specific incident that triggered this?",
      "What's the history with this supplier?",
    ],
  },

  escalation: {
    pl: [
      "Do jakiego szczebla to dotarło?",
      "Co chce osiągnąć ten poziom?",
      "Kto teraz prowadzi rozmowy?",
      "Jakie są oczekiwania zarządu?",
      "Co się stanie jeśli nie dojdziecie do porozumienia?",
      "Kto podjął decyzję o eskalacji?",
    ],
    en: [
      "How far up has this gone?",
      "What does that level want to achieve?",
      "Who's leading the talks now?",
      "What are the board's expectations?",
      "What happens if you don't reach an agreement?",
      "Who decided to escalate?",
    ],
  },

  followup: {
    pl: [
      "Co wydarzyło się dalej?",
      "Jak zareagowali?",
      "I co potem?",
      "Jakie jest kolejne spotkanie?",
      "Co się zmieniło?",
      "Dalej to samo stanowisko?",
      "Coś nowego po Waszej stronie?",
    ],
    en: [
      "What happened next?",
      "How did they react?",
      "And then?",
      "When's the next meeting?",
      "Has anything changed?",
      "Still the same position?",
      "Anything new on your side?",
    ],
  },

  clarification: {
    pl: [
      "Odpowiedź na pytanie lub więcej kontekstu…",
      "Co chcesz dodać?",
      "Więcej szczegółów o sytuacji…",
      "Powiedz coś więcej…",
      "Doprecyzowanie…",
    ],
    en: [
      "Answer or add more context…",
      "What would you like to add?",
      "More details about the situation…",
      "Tell me more…",
      "Clarify…",
    ],
  },

  emotional_pressure: {
    pl: [
      "Co jest teraz najważniejsze do ogarnięcia?",
      "Zacznijmy od jednej rzeczy — co pali najbardziej?",
      "Co możesz kontrolować w tej chwili?",
      "Spokojnie — co konkretnie się dzieje?",
      "Jeden krok — co jest najpilniejsze?",
    ],
    en: [
      "What's the most urgent thing to address?",
      "Let's start with one thing — what's burning most?",
      "What can you actually control right now?",
      "Take it one step — what's specifically happening?",
      "One thing at a time — what's most pressing?",
    ],
  },
};

// ── Signal patterns for stage detection ───────────────────────────────────────

const STRESS_SIGNALS: RegExp[] = [
  /panic|chaos|overwhelm|everything is (urgent|on fire)|firefighting|crisis/i,
  /panika|chaos|kryzys|pali się|nie dajemy rady|wszystko się wali/i,
  /pilne|asap|do jutra|za godzinę|natychmiast|na wczoraj/i,
];

const NEGOTIATION_SIGNALS: RegExp[] = [
  /supplier (claims|says|threatens|pushes|demands|escalated|bluff)/i,
  /dostawca (grozi|żąda|naciska|eskaluje|blefuje|mówi|twierdzi)/i,
  /\boferta\b|pierwsza oferta|podwyżka|price increase|ultimatum|negocjacj/i,
  /counter(offer| proposal)|kontrpropozycj/i,
];

const SHOULD_COST_SIGNALS: RegExp[] = [
  /should.?cost|cost breakdown|material(s)? cost|labor cost|overhead/i,
  /struktura kosztow|kosztorys|wolumen|koszt materiał|marż[ae]|benchmark/i,
  /bill of material|bom|direct cost|indirect cost/i,
];

const EXECUTIVE_SIGNALS: RegExp[] = [
  /\bboard\b|zarząd|prezes|ceo|c-suite|executive|strategia|governance/i,
  /decyzja (strategiczna|zarządu)|poziom (zarządu|c-suite)|strategic decision/i,
];

const SUPPLIER_CONFLICT_SIGNALS: RegExp[] = [
  /single source|sole source|sole supplier|vendor lock/i,
  /zależni|brak alternatyw|zmiana dostawcy|konflikt z dostawcą/i,
  /supplier conflict|dependent on|switching cost/i,
];

const ESCALATION_SIGNALS: RegExp[] = [
  /\bescalat/i,
  /eskalacja|poziom wyżej|poszło wyżej|dyrektor generalny|vp of|chief /i,
];

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

// ── Stage detection ────────────────────────────────────────────────────────────

export function detectConversationStage(messages: ChatMessage[]): ConversationStage {
  if (messages.length === 0) return "cold_start";

  const recent = messages.slice(-6);
  const recentText = recent.map((m) => m.content).join(" ");

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const lastContent = lastAssistant?.content ?? "";

  // 1. Emotional pressure — highest priority
  if (matchesAny(recentText, STRESS_SIGNALS)) return "emotional_pressure";

  // 2. Escalation
  if (matchesAny(recentText, ESCALATION_SIGNALS)) return "escalation";

  // 3. Clarification — assistant ended with a question
  if (/\?\s*$/.test(lastContent.trim())) return "clarification";

  // 4. Specific procurement scenarios
  if (matchesAny(recentText, NEGOTIATION_SIGNALS)) return "negotiation";
  if (matchesAny(recentText, SHOULD_COST_SIGNALS)) return "should_cost";
  if (matchesAny(recentText, EXECUTIVE_SIGNALS)) return "executive";
  if (matchesAny(recentText, SUPPLIER_CONFLICT_SIGNALS)) return "supplier_conflict";

  // 5. Depth-based fallback
  if (messages.length >= 8) return "followup";

  return "discovery";
}

// ── Main generator ─────────────────────────────────────────────────────────────

export function generateDynamicPlaceholder({
  conversationStage,
  interactionMode,
  locale,
  messageCount,
  recentlyUsed = [],
}: PlaceholderInput): string {
  const pool = POOL[conversationStage]?.[locale] ?? POOL.discovery[locale];

  // Filter recently used (last 3)
  let candidates = pool.filter((p) => !recentlyUsed.includes(p));
  if (candidates.length === 0) candidates = [...pool];

  // Prefer shorter placeholders as conversation deepens
  if (messageCount > 8) {
    const short = candidates.filter((p) => p.length < 32);
    if (short.length > 0) candidates = short;
  }

  // Tactical modes → more direct (shorter)
  if (
    interactionMode === "tactical_negotiator" ||
    interactionMode === "cold_exec" ||
    interactionMode === "skeptical_buyer"
  ) {
    const direct = candidates.filter((p) => p.length < 42);
    if (direct.length > 0) candidates = direct;
  }

  // Stressed mode → softer/longer
  if (interactionMode === "stressed_supportive") {
    const soft = candidates.filter((p) => p.length > 28);
    if (soft.length > 0) candidates = soft;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ── Convenience wrapper ────────────────────────────────────────────────────────

export function getPlaceholderFromMessages(
  messages: ChatMessage[],
  locale: "pl" | "en",
  recentlyUsed: string[] = []
): string {
  const stage = detectConversationStage(messages);
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const interactionMode = lastAssistant?.interactionMode as InteractionMode | undefined;

  return generateDynamicPlaceholder({
    conversationStage: stage,
    interactionMode,
    locale,
    messageCount: messages.length,
    recentlyUsed,
  });
}
