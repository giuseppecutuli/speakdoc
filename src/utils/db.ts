import Dexie, { type Table } from 'dexie';
import type { DocumentationSession, SessionFeedback } from '@/types/session';

export interface WhisperModelRecord {
  modelId: string;
  data: ArrayBuffer;
  cachedAt: number;
}

class DocAssistantDB extends Dexie {
  sessions!: Table<DocumentationSession>;
  feedback!: Table<SessionFeedback>;
  whisperModels!: Table<WhisperModelRecord>;

  constructor() {
    super('DocAssistantDB');
    this.version(1).stores({
      sessions: '++id, speakingLanguage, outputLanguage, format, createdAt',
      feedback: '++id, sessionId, rating, createdAt',
    });
    this.version(2).stores({
      sessions: '++id, speakingLanguage, outputLanguage, format, createdAt',
      feedback: '++id, sessionId, rating, createdAt',
      whisperModels: 'modelId, cachedAt',
    });
  }
}

export const db = new DocAssistantDB();
