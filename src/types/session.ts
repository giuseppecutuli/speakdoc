import type { LanguageCode } from './language';
import type { OutputFormat } from './documentation';

export interface DocumentationSession {
  id?: number;
  /** User-visible title; defaults are assigned on save until renamed. */
  name?: string;
  speakingLanguage: LanguageCode;
  outputLanguage: LanguageCode;
  transcription: string;
  generatedDoc: string;
  format: OutputFormat;
  aiBackend: 'gemini-nano' | 'external-api';
  createdAt: Date;
  /** Optional mic recording for replay / download (subject to size limits at save time). */
  audioBlob?: Blob;
}

export interface SessionFeedback {
  id?: number;
  sessionId: number;
  rating: 'helpful' | 'not-helpful';
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
  savedAt: Date;
  updatedAt?: Date;
}
