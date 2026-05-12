// Shared types for Advisory Evaluation Environment

export type Role = "user" | "assistant";

export interface ChatMessage {
  id: string;           // client-side nanoid
  role: Role;
  content: string;
  isStreaming?: boolean;
  dbId?: string;        // server-assigned DB id (from message_saved event)
  interactionMode?: string;
}

export interface FeedbackRatings {
  naturalness?: number;       // 1-5: Naturalność rozmowy
  adequacy?: number;          // 1-5: Adekwatność odpowiedzi
  practicality?: number;      // 1-5: Poziom praktyczności
  practitionerFeel?: number;  // 1-5: Czy brzmi jak praktyk?
  trustLevel?: number;        // 1-5: Poziom zaufania
}

export interface FeedbackText {
  whatWasUnnatural?: string;
  whatWasValuable?: string;
  whatSoundedAI?: string;
  tooConsulting?: string;
  tooLong?: string;
  tooConfident?: string;
  freeComment?: string;
}

export type FeedbackPayload = FeedbackRatings & FeedbackText & { messageId: string };

// Admin types
export interface TranscriptMessage {
  id: string;
  role: string;
  content: string;
  interactionMode: string | null;
  createdAt: string;
  feedback: {
    naturalness: number | null;
    adequacy: number | null;
    practicality: number | null;
    practitionerFeel: number | null;
    trustLevel: number | null;
    whatWasUnnatural: string | null;
    whatWasValuable: string | null;
    whatSoundedAI: string | null;
    tooConsulting: string | null;
    tooLong: string | null;
    tooConfident: string | null;
    freeComment: string | null;
  } | null;
}

export interface TranscriptSession {
  id: string;
  createdAt: string;
  sessionLocale: string;
  assistantLanguage: string;
  feedbackLanguage: string;
  userSwitchedLocale: boolean;
  switchTimestamp: string | null;
  testerNote: string | null;
  messages: TranscriptMessage[];
  metric: {
    messageCount: number;
    totalFeedbackGiven: number;
    avgNaturalness: number | null;
    avgPractitionerFeel: number | null;
    avgTrustLevel: number | null;
  } | null;
}
