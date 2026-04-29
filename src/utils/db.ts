import Dexie, { type Table } from 'dexie';
import type { DocumentationSession, SessionFeedback, SessionDraft } from '@/types/session';

class DocAssistantDB extends Dexie {
  sessions!: Table<DocumentationSession>;
  feedback!: Table<SessionFeedback>;
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
    this.version(4).stores({
      sessions: '++id, speakingLanguage, outputLanguage, format, createdAt',
      feedback: '++id, sessionId, rating, createdAt',
      whisperModels: null,
      drafts: '++id, savedAt',
    });
    this.version(5).stores({
      sessions: '++id, speakingLanguage, outputLanguage, format, createdAt',
      feedback: '++id, sessionId, rating, createdAt',
      drafts: '++id, savedAt, updatedAt',
    });
  }
}

export const db = new DocAssistantDB();
