import Dexie, { type Table } from 'dexie';
import type { DocumentationSession, SessionFeedback } from '@/types/session';

class DocAssistantDB extends Dexie {
  sessions!: Table<DocumentationSession>;
  feedback!: Table<SessionFeedback>;

  constructor() {
    super('DocAssistantDB');
    this.version(1).stores({
      sessions: '++id, speakingLanguage, outputLanguage, format, createdAt',
      feedback: '++id, sessionId, rating, createdAt',
    });
  }
}

export const db = new DocAssistantDB();
