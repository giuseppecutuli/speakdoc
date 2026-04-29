import type { LanguageCode } from './language';
import type { OutputFormat } from './documentation';
import type { DocumentationAiBackend } from './ai';

export interface DocumentationSession {
  id?: number;
  /** User-visible title; defaults are assigned on save until renamed. */
  name?: string;
  speakingLanguage: LanguageCode;
  outputLanguage: LanguageCode;
  transcription: string;
  generatedDoc: string;
  format: OutputFormat;
  aiBackend: DocumentationAiBackend;
  createdAt: Date;
  /** Optional mic recording for replay / download (subject to size limits at save time). */
  audioBlob?: Blob;
  /** When recording exceeds single-blob limit, audio is split into slices (see `audio-chunk-storage.ts`). */
  audioChunks?: Blob[];
  /** MIME for reassembly (`audio/webm`, etc.). */
  audioMimeType?: string;
}

export type SessionFeedbackRating = 'helpful' | 'not-helpful';

export interface SessionFeedback {
  id?: number;
  sessionId: number;
  rating: SessionFeedbackRating;
  createdAt: Date;
}

export interface SessionDraft {
  id?: number;
  /** Auto or user-edited label for draft lists (optional for legacy rows). */
  title?: string;
  transcription: string;
  generatedDoc: string;
  format: string;
  speakingLanguage: string;
  outputLanguage: string;
  audioBlob?: Blob;
  audioChunks?: Blob[];
  audioMimeType?: string;
  savedAt: Date;
  updatedAt?: Date;
}
