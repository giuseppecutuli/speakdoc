import Dexie, { type Table } from 'dexie';
import type { DocumentationSession, SessionFeedback, SessionDraft } from '@/types/session';

export interface WhisperModelRecord {
  modelId: string;
  data: ArrayBuffer;
  cachedAt: number;
}

class DocAssistantDB extends Dexie {
  sessions!: Table<DocumentationSession>;
  feedback!: Table<SessionFeedback>;
  whisperModels!: Table<WhisperModelRecord>;
  drafts!: Table<SessionDraft>;

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
    this.version(3).stores({
      sessions: '++id, speakingLanguage, outputLanguage, format, createdAt',
      feedback: '++id, sessionId, rating, createdAt',
      whisperModels: 'modelId, cachedAt',
      drafts: '++id, savedAt',
    });
  }
}

export const db = new DocAssistantDB();
