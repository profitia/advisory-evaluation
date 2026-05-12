// Minimal multilingual detection — ETAP 8.5 snapshot
// Extracted from CI-Profitia website / src/runtime/engines/multilingual-runtime.ts

export type SupportedLocale = "pl" | "en";

const PL_SIGNALS =
  /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]|\b(że|czy|jak|co|się|nie|ale|dla|przy|przez|więc|jednak|mam|mamy|jest|są|był|była|tego|tej|ten|ta|to|ze|za|po|na|do|od|we|bo|już)\b/gi;

const EN_SIGNALS =
  /\b(the|is|are|was|were|have|has|had|will|would|can|could|should|that|this|with|from|they|their|there|what|when|how|why|our|your|my|we|you|he|she|it|also|just|only|very|really|need|want|get|make|know|think|work|help|give|take)\b/gi;

function detectLanguageDominance(text: string): SupportedLocale {
  if (!text || text.trim().length < 10) return "pl";

  const plMatches = (text.match(PL_SIGNALS) ?? []).length;
  const enMatches = (text.match(EN_SIGNALS) ?? []).length;
  const total = plMatches + enMatches;

  if (total === 0) return "pl";
  return plMatches / total >= 0.4 ? "pl" : "en";
}

export function detectConversationLanguageDominance(
  messages: Array<{ role: string; content: string }>
): SupportedLocale {
  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length === 0) return "pl";

  const last = userMessages[userMessages.length - 1];
  const rest = userMessages.slice(0, -1);

  const combinedText = [
    ...rest.map((m) => m.content),
    last.content,
    last.content, // double-weight last message
  ].join(" ");

  return detectLanguageDominance(combinedText);
}
