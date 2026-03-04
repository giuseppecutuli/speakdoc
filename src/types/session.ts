import type { LanguageCode } from './language';
import type { OutputFormat } from './documentation';

export interface DocumentationSession {
  id?: number;
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
