// ─────────────────────────────────────────────────────────
// ETAP 8.5 Snapshot — Human Mode Router
// Frozen: 2026-05-12 | Tag: etap-8.5-stable-realism-baseline
// Source: CI-Profitia website / src/runtime/engines/interaction-mode-router.ts
// ─────────────────────────────────────────────────────────

export type InteractionMode =
  | "cold_exec"           // Direct strategic / board / high-confidence
  | "stressed_supportive" // Chaos, overwhelm, crisis, firefighting
  | "tactical_negotiator" // Active supplier pressure, live negotiation
  | "analytical_exec"     // Data request, benchmarks, numbers-driven
  | "skeptical_buyer"     // Testing, cynical, pushback, doubting
  | "operational_manager" // Reactive ops, process question, low abstraction
  | "mentoring_director"; // Junior buyer, exploratory, low stress learning

// ── Signal patterns ───────────────────────────────────────

const STRESS_SIGNALS = [
  /nie wiem (co|jak|co robić)/i,
  /chaos/i,
  /panika/i,
  /kryzys/i,
  /ratuj(cie|)/i,
  /pilne/i,
  /wszystko się/i,
  /nie dajemy rady/i,
  /overwhelmed/i,
  /everything is (urgent|on fire|falling apart)/i,
  /i don't know (what|where|how)/i,
  /crisis/i,
  /firefighting/i,
  /burning/i,
  /presja (ze strony|zarządu|boardu)/i,
  /deadline za/i,
  /do jutra/i,
  /za tydzień/i,
  /natychmiast/i,
  /asap/i,
  /musimy coś zrobić/i,
];

const NEGOTIATION_PRESSURE_SIGNALS = [
  /dostawca (twierdzi|mówi|grozi|eskaluje|naciska|żąda|wyśle|zagroził)/i,
  /supplier (claims|says|threatens|pushes|demands|escalated)/i,
  /ultimatum/i,
  /podwyżka/i,
  /price increase/i,
  /blef/i,
  /bluff/i,
  /nie zejdą niżej/i,
  /won't go lower/i,
  /oferta ważna do/i,
  /offer expires/i,
  /scarcity/i,
  /mają ograniczone moce/i,
  /last available/i,
  /eskalował do/i,
  /bypassed me/i,
  /ominął mnie/i,
  /presja terminowa/i,
  /deadline pressure/i,
  /zakotwiczył/i,
  /anchor/i,
];

const ANALYTICAL_SIGNALS = [
  /ile (kosztuje|wynosi|jest|będzie)/i,
  /benchmark/i,
  /dane/i,
  /liczby/i,
  /procent/i,
  /ROI/i,
  /EBIT/i,
  /marża/i,
  /savings/i,
  /oszczędności/i,
  /should-cost/i,
  /cost breakdown/i,
  /jak (zmierzyć|policzyć|ocenić|wyliczyć)/i,
  /how (to calculate|to measure|much|many)/i,
  /what (is the|are the) (data|numbers|figures|metrics)/i,
  /KPI/i,
  /wskaźniki/i,
];

const SKEPTICAL_SIGNALS = [
  /nie wierzę/i,
  /don't believe/i,
  /wątpię/i,
  /doubt/i,
  /konsultanci (nigdy|zawsze|zwykle)/i,
  /consultants (never|always|typically)/i,
  /to samo co każdy/i,
  /same as everyone/i,
  /tylko teoria/i,
  /just theory/i,
  /co z tego wynika/i,
  /so what/i,
  /i (co z tego|co mi to daje)/i,
  /dlaczego miałbym/i,
  /why should i/i,
  /prove it/i,
  /udowodnij/i,
  /kolejny doradca/i,
  /another consultant/i,
];

const EXECUTIVE_BOARD_SIGNALS = [
  /zarząd/i,
  /board/i,
  /CEO/i,
  /CFO/i,
  /dyrektor (zarządzający|generalny)/i,
  /MD/i,
  /strategic/i,
  /strategiczn/i,
  /operating model/i,
  /model operacyjny/i,
  /transformation/i,
  /transformacj/i,
  /business case/i,
  /uzasadnienie biznesowe/i,
  /całościow/i,
  /portfolio/i,
  /make or buy/i,
  /make vs buy/i,
  /capex/i,
  /opex/i,
];

const JUNIOR_EXPLORATORY_SIGNALS = [
  /jak zacząć/i,
  /where (to start|do i start|do I begin)/i,
  /co to jest/i,
  /what is/i,
  /czy (mógłbyś|możesz) wyjaśnić/i,
  /can you explain/i,
  /uczę się/i,
  /i'm learning/i,
  /dopiero zaczynam/i,
  /just starting/i,
  /podstawy/i,
  /basics/i,
  /dla kogoś (kto|bez)/i,
  /for someone (who|without)/i,
  /nie mam doświadczenia/i,
  /no experience/i,
  /jak (działa|funkcjonuje)/i,
  /how does .{1,30} work/i,
];

const OPERATIONAL_SIGNALS = [
  /proces/i,
  /procedura/i,
  /zamówienie/i,
  /order/i,
  /faktura/i,
  /invoice/i,
  /ERP/i,
  /SAP/i,
  /workflow/i,
  /approval/i,
  /zatwierdzenie/i,
  /jak (zorganizować|usprawnić|poprawić) (proces|procedurę)/i,
  /jak (szybko|skutecznie) obsłużyć/i,
  /operacyjnie/i,
  /day-to-day/i,
  /codziennie/i,
];

// ── Scoring helper ────────────────────────────────────────

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.filter((p) => p.test(text)).length;
}

// ── Main router ───────────────────────────────────────────

export function detectInteractionMode(
  messages: Array<{ role: string; content: string }>
): InteractionMode {
  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length === 0) return "cold_exec";

  const recentMessages = userMessages.slice(-2);
  const lastMessage = userMessages[userMessages.length - 1]?.content ?? "";
  const combinedText = recentMessages.map((m) => m.content).join(" ") + " " + lastMessage;

  const scores: Record<InteractionMode, number> = {
    stressed_supportive: countMatches(combinedText, STRESS_SIGNALS) * 3,
    tactical_negotiator: countMatches(combinedText, NEGOTIATION_PRESSURE_SIGNALS) * 3,
    analytical_exec: countMatches(combinedText, ANALYTICAL_SIGNALS) * 2,
    skeptical_buyer: countMatches(combinedText, SKEPTICAL_SIGNALS) * 2,
    cold_exec: countMatches(combinedText, EXECUTIVE_BOARD_SIGNALS) * 2,
    mentoring_director: countMatches(combinedText, JUNIOR_EXPLORATORY_SIGNALS) * 2,
    operational_manager: countMatches(combinedText, OPERATIONAL_SIGNALS) * 1,
  };

  const lastLower = lastMessage.toLowerCase();
  if (STRESS_SIGNALS.some((p) => p.test(lastLower))) {
    scores.stressed_supportive += 10;
  }
  if (NEGOTIATION_PRESSURE_SIGNALS.some((p) => p.test(lastLower))) {
    scores.tactical_negotiator += 8;
  }

  const winner = (Object.entries(scores) as [InteractionMode, number][])
    .sort(([, a], [, b]) => b - a)[0];

  return winner[1] > 0 ? winner[0] : "cold_exec";
}

// ── Mode → behavioral instructions ───────────────────────

export interface ModeInstructions {
  mode: InteractionMode;
  toneDirective: string;
  lengthDirective: string;
  framingDirective: string;
  empathyStyle: string;
  completenessRule: string;
}

export function getModeInstructions(mode: InteractionMode, isPL: boolean): ModeInstructions {
  const instructions: Record<InteractionMode, ModeInstructions> = {
    cold_exec: {
      mode,
      toneDirective: isPL
        ? "Chłodny, krótki, asymetryczny. Bez tłumaczenia oczywistości."
        : "Cold, brief, asymmetric. Don't explain what's obvious.",
      lengthDirective: "60–100 words max. Executive cadence.",
      framingDirective: isPL
        ? "Business framing tylko przy realnym stake: marża, ryzyko, cash, ciągłość."
        : "Business framing only when stakes are real: margin, risk, cash, continuity.",
      empathyStyle: isPL
        ? "Zero terapii. Diagnoza sytuacji zamiast: 'Tu dostawca próbuje skrócić czas decyzji.'"
        : "Zero therapy. Situation diagnosis instead: 'Supplier is compressing your decision timeline.'",
      completenessRule: "Leave reasoning open. One sharp sentence can be the full answer.",
    },
    stressed_supportive: {
      mode,
      toneDirective: isPL
        ? "Spokojny, stabilizujący, konkretny. Żadnego corporate tone."
        : "Calm, stabilizing, concrete. No corporate tone.",
      lengthDirective: "60–90 words. Short sentences. Clear priority.",
      framingDirective: isPL
        ? "Jeden problem na raz. Nie przytłaczaj. Najpierw co teraz, potem co dalej."
        : "One problem at a time. Don't overwhelm. First: what now. Then: what next.",
      empathyStyle: isPL
        ? "Executive acknowledgment: 'To już wygląda na presję kwartalną.' Nie terapia."
        : "Executive acknowledgment: 'This looks like quarterly pressure.' Not therapy.",
      completenessRule: "Give one clear direction. Don't audit everything at once.",
    },
    tactical_negotiator: {
      mode,
      toneDirective: isPL
        ? "Zimny, precyzyjny, kupieckim głosem. Nie trener — praktyk."
        : "Cold, precise, buyer's voice. Not a trainer — a practitioner.",
      lengthDirective: "50–110 words. Blunt naming + one move.",
      framingDirective: isPL
        ? "Nazwij taktykę dostawcy w pierwszym zdaniu. Potem pozycja lub ruch."
        : "Name the supplier tactic in the first sentence. Then position or move.",
      empathyStyle: isPL
        ? "'Nie odpowiadałbym na to od razu.' / 'To jest moment w którym łatwo przepłacić.' Zero wyjaśniania mechanizmu."
        : "'I wouldn't respond to this immediately.' / 'This is the moment where overpaying happens.' Zero mechanism explanation.",
      completenessRule: "Naming the tactic is enough. Don't close every loop.",
    },
    analytical_exec: {
      mode,
      toneDirective: isPL
        ? "Precyzyjny, oparty na danych, bez generycznych fraz."
        : "Precise, data-grounded, no generic phrases.",
      lengthDirective: "80–130 words. Numbers, benchmarks, specifics.",
      framingDirective: isPL
        ? "Pokaż konkretny impact: 'To zamknie marżę o 2-3 pkt.'"
        : "Show concrete impact: 'This closes margin by 2-3 points.'",
      empathyStyle: isPL
        ? "Dane zamiast emocji. 'Tu jest asymetria informacyjna po stronie dostawcy.'"
        : "Data over emotion. 'There's an information asymmetry on the supplier side.'",
      completenessRule: "Be specific. Benchmarks without ranges are useless.",
    },
    skeptical_buyer: {
      mode,
      toneDirective: isPL
        ? "Spokojny, bez defensywności. Nie tłumacz się — pokaż."
        : "Calm, non-defensive. Don't explain yourself — demonstrate.",
      lengthDirective: "60–90 words. Concrete. No filler.",
      framingDirective: isPL
        ? "Konkretny przykład lub mechanizm. Nie 'typowo', ale 'w tej sytuacji'."
        : "Concrete example or mechanism. Not 'typically' but 'in this situation'.",
      empathyStyle: isPL
        ? "Sceptycyzm jest uzasadniony. Nie walcz z nim — wejdź w niego."
        : "Skepticism is warranted. Don't fight it — enter it.",
      completenessRule: "One sharp concrete point beats three generic ones.",
    },
    operational_manager: {
      mode,
      toneDirective: isPL
        ? "Pragmatyczny, krokowy, konkretny. Bez abstrakcji."
        : "Pragmatic, step-by-step, concrete. No abstraction.",
      lengthDirective: "70–110 words. Max 3 steps if needed.",
      framingDirective: isPL
        ? "Co zrobić teraz. Jakie narzędzie. Jaki efekt."
        : "What to do now. Which tool. What result.",
      empathyStyle: isPL
        ? "Operacyjna solidarność: 'To jest typowy problem przy braku widoczności zamówień.'"
        : "Operational solidarity: 'This is a classic issue with order visibility gaps.'",
      completenessRule: "Give a workable path, not a perfect one.",
    },
    mentoring_director: {
      mode,
      toneDirective: isPL
        ? "Cierpliwy, mentor — ale nie wykład. Pytaj, orient, nie zasypuj."
        : "Patient, mentor — but not a lecture. Ask, orient, don't overwhelm.",
      lengthDirective: "70–100 words. Build up gradually.",
      framingDirective: isPL
        ? "Kontekst przed narzędziem. Dlaczego to ważne przed jak to zrobić."
        : "Context before tool. Why it matters before how to do it.",
      empathyStyle: isPL
        ? "Normalizuj pytanie: 'To częste na tym etapie — dobry punkt startowy.'"
        : "Normalize the question: 'This is common at this stage — good starting point.'",
      completenessRule: "Build one concept at a time. Leave room to ask back.",
    },
  };

  return instructions[mode];
}

export function shouldAddBusinessFraming(mode: InteractionMode, recentText: string): boolean {
  const highStakeSignals = [
    /marża/i, /EBIT/i, /cash/i, /ryzyko/i, /strat[ay]/i, /zarząd/i,
    /board/i, /CFO/i, /CEO/i, /budżet/i, /budget/i, /oszczędno/i, /savings/i,
    /exposure/i, /dependency/i, /ciągłość/i, /continuity/i,
  ];

  const alwaysFrame: InteractionMode[] = ["cold_exec", "analytical_exec"];
  if (alwaysFrame.includes(mode)) return true;

  return highStakeSignals.some((p) => p.test(recentText));
}
