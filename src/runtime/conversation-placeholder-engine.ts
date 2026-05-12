// ─────────────────────────────────────────────────────────────────────────────
// ETAP UX-CONV-2 — Conversational Momentum Placeholder Engine
// UX perception layer only. Zero runtime / AI / scoring changes.
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

export type PlaceholderCategory =
  | "conversational_hook"
  | "implied_followup"
  | "tactical_reaction"
  | "skeptical_probe"
  | "tension_builder"
  | "executive_shortcut"
  | "unfinished_thought"
  | "emotional_softener"
  | "momentum_push"
  | "silence_prompt";

export interface MomentumState {
  tension: number;      // 0–1: conflict / negotiation pressure in recent msgs
  engagement: number;   // 0–1: user message depth / length
  fatigue: number;      // 0–1: long conversation or declining msg length
  escalation: number;   // 0–1: escalation signals
  momentum: number;     // –1 (declining) → 1 (high energy)
}

export interface UserEnergyProfile {
  isHurried: boolean;     // short messages, fast pace
  isEmotional: boolean;   // stress signals, caps, exclamation
  isExploratory: boolean; // questions, long messages, detail-seeking
  isFatigued: boolean;    // sharply declining message length
  avgLength: number;      // recent user msg avg chars
  trend: "declining" | "stable" | "expanding";
}

export interface PlaceholderInput {
  conversationStage: ConversationStage;
  interactionMode?: InteractionMode;
  locale: "pl" | "en";
  messageCount: number;
  recentlyUsed?: string[];
  momentum?: MomentumState;
  userEnergy?: UserEnergyProfile;
}

// ── Category placeholder pools ────────────────────────────────────────────────
// Style: micro-conversational continuations, NOT UI helpers.
// Mix: reactions, probes, hooks, implied follow-ups, half-sentences, single words.
// Do NOT add full polite questions — keep asymmetric and lightly imperfect.

type LocalePool = { pl: string[]; en: string[] };
const CATEGORY_POOLS: Record<PlaceholderCategory, LocalePool> = {

  momentum_push: {
    pl: ["I?", "No i?", "Dalej…", "Hmm.", "No właśnie.", "A benchmark?", "I co?", "Mhm.", "No?", "I co potem?"],
    en: ["And?", "Right…", "Go on.", "Hmm.", "So?", "Benchmark?", "Then what?", "Okay?", "No?", "And then?"],
  },

  silence_prompt: {
    pl: ["...", "No?", "Rozumiem…", "Mhm…", "Tak?", "Słucham.", "Ciekaw jestem."],
    en: ["...", "Yes?", "I see…", "Hmm…", "Interesting.", "Go ahead.", "I'm listening."],
  },

  conversational_hook: {
    pl: [
      "Klasyczne zakotwiczenie.",
      "I oni serio w to idą?",
      "Brzmi jak squeeze.",
      "Znajome zagranie.",
      "To ich opening?",
      "Nie brzmi dobrze.",
      "Standardowe posunięcie.",
      "I co na to biznes?",
      "Ciekawe, że właśnie teraz.",
    ],
    en: [
      "Classic anchoring.",
      "And they expect you to accept that?",
      "Feels like pressure tactics.",
      "Familiar move.",
      "First offer?",
      "Not a great sign.",
      "And what did the business say?",
      "That's a common play.",
      "Interesting timing.",
    ],
  },

  implied_followup: {
    pl: [
      "I co było dalej?",
      "Co się zmieniło?",
      "Co powiedzieli po tym?",
      "Jak zareagowali?",
      "A następny krok?",
      "I co potem?",
      "Co było pierwsze?",
      "Jak to się skończyło?",
    ],
    en: [
      "What happened next?",
      "What changed?",
      "How did they respond?",
      "And then?",
      "What's the next step?",
      "What came first?",
      "How did it end?",
      "After that?",
    ],
  },

  tactical_reaction: {
    pl: [
      "Tu bym uważał.",
      "A BATNA?",
      "To zmienia układ.",
      "Warto to sprawdzić.",
      "A kontrpropozycja?",
      "Nie wygląda dobrze.",
      "To istotne.",
      "Ile realnie możecie przenieść?",
      "Co mówi rynek?",
    ],
    en: [
      "I'd be careful here.",
      "What's the BATNA?",
      "That changes things.",
      "Worth checking.",
      "Counter offer?",
      "Not looking good.",
      "That matters.",
      "How much could you realistically move?",
      "What's the market saying?",
    ],
  },

  skeptical_probe: {
    pl: [
      "I wierzysz w to?",
      "Blef czy nie?",
      "Na pewno to prawdziwy powód?",
      "Brzmi jak pretekst.",
      "To ich rzeczywiste stanowisko?",
      "Pewne, że to wszystko?",
      "Nie wydaje mi się.",
      "I tyle?",
    ],
    en: [
      "Do you believe that?",
      "Bluff or not?",
      "Sure that's the real reason?",
      "Sounds like a pretext.",
      "Is that their real position?",
      "Sure that's everything?",
      "I'm not so sure.",
      "That's it?",
    ],
  },

  tension_builder: {
    pl: [
      "Tu jest ryzyko.",
      "To zmienia dużo.",
      "Zależy jak bardzo jesteście zależni.",
      "I to przy waszym wolumenie?",
      "Nie wygląda komfortowo.",
      "To mogło was mocno ustawić pod ścianą.",
      "To jeszcze zależy od jednej rzeczy…",
      "A jeśli odmówią?",
    ],
    en: [
      "There's risk here.",
      "That changes a lot.",
      "Depends how dependent you are.",
      "At your volume?",
      "Doesn't look comfortable.",
      "That could put you in a tough spot.",
      "That depends on one thing…",
      "What if they say no?",
    ],
  },

  executive_shortcut: {
    pl: [
      "Ile to realnie kosztuje?",
      "Kto naprawdę ma leverage?",
      "To problem operacyjny czy polityczny?",
      "I zarząd o tym wie?",
      "Jaka jest opcja B?",
      "Ile czasu macie?",
      "Kto podejmuje decyzję?",
      "Jaki jest cel tej rozmowy?",
    ],
    en: [
      "What does it actually cost?",
      "Who really has leverage here?",
      "Operational or political?",
      "Does leadership know?",
      "What's option B?",
      "How much time do you have?",
      "Who makes the call?",
      "What's the goal of this conversation?",
    ],
  },

  unfinished_thought: {
    pl: [
      "Nie wiem czy to ich prawdziwy problem.",
      "Brzmi znajomo.",
      "To już bym sprawdził.",
      "Ciekawe.",
      "Hmm, to coś zmienia.",
      "To trochę zmienia układ.",
      "Coś tu nie gra.",
      "To może być ważne.",
    ],
    en: [
      "Not sure that's their real issue.",
      "Sounds familiar.",
      "I'd look into that.",
      "Interesting.",
      "Hmm, that changes things.",
      "That shifts the dynamic.",
      "Something doesn't add up.",
      "That could matter.",
    ],
  },

  emotional_softener: {
    pl: [
      "Spokojnie — co dokładnie się wydarzyło?",
      "Od czego to się zaczęło?",
      "Dobra, po kolei.",
      "Najpierw kontekst.",
      "To mogło być trudne.",
      "Bez pośpiechu — od początku.",
      "Co jest teraz największym problemem?",
      "Zacznijmy od jednej rzeczy.",
    ],
    en: [
      "Take it easy — what exactly happened?",
      "Where did this start?",
      "Okay, one step at a time.",
      "Context first.",
      "That sounds tough.",
      "No rush — from the beginning.",
      "What's the biggest issue right now?",
      "Let's start with one thing.",
    ],
  },
};

// ── Base category weights by stage ─────────────────────────────────────────────
// Scale 0–10. Adjusted dynamically by momentum, energy, interaction mode.

type CategoryWeights = Record<PlaceholderCategory, number>;

const STAGE_BASE_WEIGHTS: Record<ConversationStage, CategoryWeights> = {
  cold_start: {
    conversational_hook: 3, implied_followup: 1, tactical_reaction: 0,
    skeptical_probe: 0, tension_builder: 0, executive_shortcut: 1,
    unfinished_thought: 2, emotional_softener: 5, momentum_push: 1, silence_prompt: 0,
  },
  discovery: {
    conversational_hook: 5, implied_followup: 6, tactical_reaction: 2,
    skeptical_probe: 2, tension_builder: 1, executive_shortcut: 2,
    unfinished_thought: 5, emotional_softener: 2, momentum_push: 2, silence_prompt: 1,
  },
  negotiation: {
    conversational_hook: 4, implied_followup: 3, tactical_reaction: 7,
    skeptical_probe: 6, tension_builder: 5, executive_shortcut: 3,
    unfinished_thought: 3, emotional_softener: 0, momentum_push: 4, silence_prompt: 1,
  },
  should_cost: {
    conversational_hook: 2, implied_followup: 4, tactical_reaction: 5,
    skeptical_probe: 4, tension_builder: 2, executive_shortcut: 6,
    unfinished_thought: 3, emotional_softener: 0, momentum_push: 2, silence_prompt: 1,
  },
  executive: {
    conversational_hook: 2, implied_followup: 2, tactical_reaction: 4,
    skeptical_probe: 4, tension_builder: 5, executive_shortcut: 8,
    unfinished_thought: 3, emotional_softener: 0, momentum_push: 3, silence_prompt: 1,
  },
  supplier_conflict: {
    conversational_hook: 3, implied_followup: 3, tactical_reaction: 5,
    skeptical_probe: 5, tension_builder: 7, executive_shortcut: 4,
    unfinished_thought: 4, emotional_softener: 1, momentum_push: 3, silence_prompt: 1,
  },
  escalation: {
    conversational_hook: 2, implied_followup: 3, tactical_reaction: 4,
    skeptical_probe: 3, tension_builder: 6, executive_shortcut: 7,
    unfinished_thought: 3, emotional_softener: 1, momentum_push: 3, silence_prompt: 1,
  },
  followup: {
    conversational_hook: 4, implied_followup: 7, tactical_reaction: 2,
    skeptical_probe: 2, tension_builder: 1, executive_shortcut: 2,
    unfinished_thought: 4, emotional_softener: 1, momentum_push: 6, silence_prompt: 3,
  },
  clarification: {
    conversational_hook: 2, implied_followup: 5, tactical_reaction: 1,
    skeptical_probe: 1, tension_builder: 0, executive_shortcut: 2,
    unfinished_thought: 3, emotional_softener: 2, momentum_push: 6, silence_prompt: 4,
  },
  emotional_pressure: {
    conversational_hook: 1, implied_followup: 2, tactical_reaction: 0,
    skeptical_probe: 0, tension_builder: 0, executive_shortcut: 1,
    unfinished_thought: 2, emotional_softener: 9, momentum_push: 4, silence_prompt: 3,
  },
};

// ── Signal patterns ───────────────────────────────────────────────────────────

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

const EMOTIONAL_USER_SIGNALS: RegExp[] = [
  /!{2,}|[A-Z]{5,}/,
  /nie wiem|nie rozumiem|ratuj|co (mam|teraz)|co robić/i,
  /terrible|horrible|awful|disaster|nightmare/i,
  /straszne|koszmar|katastrofa|tragedia/i,
];

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

// ── Momentum scoring ──────────────────────────────────────────────────────────

export function computeMomentumState(messages: ChatMessage[]): MomentumState {
  if (messages.length === 0) {
    return { tension: 0, engagement: 0.5, fatigue: 0, escalation: 0, momentum: 0 };
  }

  const recent = messages.slice(-8);
  const recentText = recent.map((m) => m.content).join(" ");

  // tension: negotiation + conflict signals in recent window
  const tensionPatterns = [...NEGOTIATION_SIGNALS, ...SUPPLIER_CONFLICT_SIGNALS];
  const tensionHits = tensionPatterns.filter((p) => p.test(recentText)).length;
  const tension = Math.min(1, tensionHits / 4);

  // escalation
  const escalationHits = ESCALATION_SIGNALS.filter((p) => p.test(recentText)).length;
  const escalation = Math.min(1, escalationHits / 2);

  // engagement: avg user message length relative to 100-char baseline
  const userMsgs = recent.filter((m) => m.role === "user");
  const avgLen = userMsgs.length > 0
    ? userMsgs.reduce((s, m) => s + m.content.length, 0) / userMsgs.length
    : 60;
  const engagement = Math.min(1, avgLen / 120);

  // fatigue: grows with total conversation length
  const totalUserMsgs = messages.filter((m) => m.role === "user");
  const fatigue = Math.min(0.7, totalUserMsgs.length / 25);

  // composite momentum
  const momentum = Math.max(-1, Math.min(1,
    tension * 0.4 + engagement * 0.4 - fatigue * 0.5 + escalation * 0.3
  ));

  return { tension, engagement, fatigue, escalation, momentum };
}

// ── User energy detection (heuristics, no AI) ─────────────────────────────────

export function detectUserEnergy(messages: ChatMessage[]): UserEnergyProfile {
  const userMsgs = messages.filter((m) => m.role === "user").slice(-6);
  if (userMsgs.length === 0) {
    return { isHurried: false, isEmotional: false, isExploratory: false, isFatigued: false, avgLength: 60, trend: "stable" };
  }

  const lengths = userMsgs.map((m) => m.content.length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;

  // Trend: compare first half vs second half
  const mid = Math.floor(lengths.length / 2) || 1;
  const firstAvg = lengths.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
  const secondHalf = lengths.slice(mid);
  const secondAvg = secondHalf.length > 0
    ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
    : firstAvg;
  const trendRatio = secondAvg / (firstAvg || 1);
  const trend: UserEnergyProfile["trend"] =
    trendRatio < 0.65 ? "declining" : trendRatio > 1.35 ? "expanding" : "stable";

  const recentText = userMsgs.map((m) => m.content).join(" ");

  const isHurried = avgLength < 35;
  const isEmotional = matchesAny(recentText, EMOTIONAL_USER_SIGNALS) || matchesAny(recentText, STRESS_SIGNALS);
  const isExploratory = avgLength > 90 && userMsgs.some((m) => m.content.includes("?"));
  const isFatigued = trend === "declining" && avgLength < 40;

  return { isHurried, isEmotional, isExploratory, isFatigued, avgLength, trend };
}

// ── Weighted random selection ─────────────────────────────────────────────────

function weightedRandom<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total === 0) return items[Math.floor(Math.random() * items.length)];
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// ── Category weight computation ───────────────────────────────────────────────

function computeCategoryWeights(
  stage: ConversationStage,
  momentum: MomentumState,
  energy: UserEnergyProfile,
  interactionMode: InteractionMode | undefined,
  messageCount: number,
): CategoryWeights {
  const w: CategoryWeights = { ...STAGE_BASE_WEIGHTS[stage] };

  // ── Momentum adjustments ──
  if (momentum.tension > 0.5) {
    w.tension_builder  += Math.round(momentum.tension * 4);
    w.skeptical_probe  += Math.round(momentum.tension * 3);
    w.tactical_reaction += Math.round(momentum.tension * 3);
  }
  if (momentum.fatigue > 0.4) {
    w.momentum_push    += Math.round(momentum.fatigue * 5);
    w.silence_prompt   += Math.round(momentum.fatigue * 4);
    w.conversational_hook = Math.max(0, w.conversational_hook - 2);
    w.implied_followup    = Math.max(0, w.implied_followup    - 2);
  }
  if (momentum.engagement < 0.3) {
    w.emotional_softener += 3;
    w.silence_prompt     += 2;
  }
  if (momentum.escalation > 0.3) {
    w.executive_shortcut += Math.round(momentum.escalation * 4);
    w.tension_builder    += 2;
  }

  // ── User energy adjustments ──
  if (energy.isHurried) {
    w.momentum_push      += 4;
    w.silence_prompt     += 3;
    w.emotional_softener  = Math.max(0, w.emotional_softener - 2);
    w.implied_followup    = Math.max(0, w.implied_followup   - 2);
  }
  if (energy.isEmotional) {
    w.emotional_softener += 6;
    w.momentum_push      += 2;
    w.tension_builder     = Math.max(0, w.tension_builder     - 4);
    w.skeptical_probe     = Math.max(0, w.skeptical_probe     - 4);
    w.tactical_reaction   = Math.max(0, w.tactical_reaction   - 3);
  }
  if (energy.isExploratory) {
    w.conversational_hook += 3;
    w.implied_followup    += 3;
    w.unfinished_thought  += 2;
  }
  if (energy.isFatigued) {
    w.momentum_push       += 5;
    w.silence_prompt      += 4;
    w.conversational_hook  = Math.max(0, w.conversational_hook  - 3);
    w.executive_shortcut   = Math.max(0, w.executive_shortcut   - 2);
  }
  if (energy.trend === "declining") {
    w.momentum_push  += 2;
    w.silence_prompt += 1;
  }

  // ── Interaction mode adjustments ──
  if (interactionMode === "tactical_negotiator") {
    w.tactical_reaction  += 5;
    w.skeptical_probe    += 4;
    w.tension_builder    += 3;
    w.emotional_softener  = Math.max(0, w.emotional_softener - 4);
  }
  if (interactionMode === "stressed_supportive") {
    w.emotional_softener += 7;
    w.momentum_push      += 2;
    w.tension_builder     = Math.max(0, w.tension_builder    - 5);
    w.skeptical_probe     = Math.max(0, w.skeptical_probe    - 5);
    w.tactical_reaction   = Math.max(0, w.tactical_reaction  - 4);
  }
  if (interactionMode === "cold_exec" || interactionMode === "analytical_exec") {
    w.executive_shortcut += 5;
    w.tactical_reaction  += 3;
    w.emotional_softener  = Math.max(0, w.emotional_softener - 3);
  }
  if (interactionMode === "skeptical_buyer") {
    w.skeptical_probe    += 5;
    w.tension_builder    += 3;
    w.conversational_hook += 2;
  }
  if (interactionMode === "mentoring_director") {
    w.unfinished_thought += 4;
    w.implied_followup   += 3;
    w.emotional_softener += 2;
  }
  if (interactionMode === "operational_manager") {
    w.implied_followup   += 3;
    w.tactical_reaction  += 2;
    w.executive_shortcut += 2;
  }

  // ── Conversation depth — deeper = shorter / more direct ──
  if (messageCount >= 10) {
    w.momentum_push      += 3;
    w.silence_prompt     += 2;
    w.conversational_hook = Math.max(0, w.conversational_hook - 2);
    w.emotional_softener  = Math.max(0, w.emotional_softener  - 1);
  }
  if (messageCount >= 18) {
    w.momentum_push  += 3;
    w.silence_prompt += 3;
  }

  // Clamp all to ≥ 0
  for (const key of Object.keys(w) as PlaceholderCategory[]) {
    w[key] = Math.max(0, w[key]);
  }
  return w;
}

// ── Stage detection ───────────────────────────────────────────────────────────

export function detectConversationStage(messages: ChatMessage[]): ConversationStage {
  if (messages.length === 0) return "cold_start";

  const recent = messages.slice(-6);
  const recentText = recent.map((m) => m.content).join(" ");

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const lastContent = lastAssistant?.content ?? "";

  // Priority order matters
  if (matchesAny(recentText, STRESS_SIGNALS))           return "emotional_pressure";
  if (matchesAny(recentText, ESCALATION_SIGNALS))       return "escalation";
  if (/\?\s*$/.test(lastContent.trim()))                return "clarification";
  if (matchesAny(recentText, NEGOTIATION_SIGNALS))      return "negotiation";
  if (matchesAny(recentText, SHOULD_COST_SIGNALS))      return "should_cost";
  if (matchesAny(recentText, EXECUTIVE_SIGNALS))        return "executive";
  if (matchesAny(recentText, SUPPLIER_CONFLICT_SIGNALS)) return "supplier_conflict";
  if (messages.length >= 8)                             return "followup";

  return "discovery";
}

// ── Main generator ────────────────────────────────────────────────────────────

export function generateDynamicPlaceholder({
  conversationStage,
  interactionMode,
  locale,
  messageCount,
  recentlyUsed = [],
  momentum,
  userEnergy,
}: PlaceholderInput): string {
  const mom = momentum ?? { tension: 0, engagement: 0.5, fatigue: 0, escalation: 0, momentum: 0 };
  const energy = userEnergy ?? { isHurried: false, isEmotional: false, isExploratory: false, isFatigued: false, avgLength: 60, trend: "stable" as const };

  const weights = computeCategoryWeights(conversationStage, mom, energy, interactionMode, messageCount);
  const categories = Object.keys(weights) as PlaceholderCategory[];
  const weightValues = categories.map((c) => weights[c]);
  const category = weightedRandom(categories, weightValues);

  const pool = CATEGORY_POOLS[category][locale];
  let candidates = pool.filter((p) => !recentlyUsed.includes(p));
  if (candidates.length === 0) candidates = [...pool];

  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ── Convenience wrapper (unchanged interface — ChatWindow compatible) ──────────

export function getPlaceholderFromMessages(
  messages: ChatMessage[],
  locale: "pl" | "en",
  recentlyUsed: string[] = []
): string {
  const stage = detectConversationStage(messages);
  const momentum = computeMomentumState(messages);
  const userEnergy = detectUserEnergy(messages);
  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const interactionMode = lastAssistant?.interactionMode as InteractionMode | undefined;

  return generateDynamicPlaceholder({
    conversationStage: stage,
    interactionMode,
    locale,
    messageCount: messages.length,
    recentlyUsed,
    momentum,
    userEnergy,
  });
}

