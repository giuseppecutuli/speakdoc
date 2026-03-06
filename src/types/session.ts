import type { LanguageCode } from './language';
import type { OutputFormat } from './documentation';

export interface DocumentationSession {
  id?: number;
  name?: string;
  speakingLanguage: LanguageCode;
  outputLanguage: LanguageCode;
  transcription: string;
  generatedDoc: string;
  format: OutputFormat;
  aiBackend: 'gemini-nano' | 'external-api';
  createdAt: Date;
}

export interface SessionFeedback {
  id?: number;
  sessionId: number;
  rating: 'helpful' | 'not-helpful';
  createdAt: Date;
}

export interface SessionDraft {
  id?: number;
  transcription: string;
  generatedDoc: string;
  format: string;
  speakingLanguage: string;
  outputLanguage: string;
  audioBlob?: Blob;
  savedAt: Date;
}
