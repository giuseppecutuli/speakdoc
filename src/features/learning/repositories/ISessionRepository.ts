import type { DocumentationSession, SessionFeedback } from '@/types/session';

export interface ISessionRepository {
  save(session: Omit<DocumentationSession, 'id'>): Promise<DocumentationSession>;
  update(id: number, changes: Partial<DocumentationSession>): Promise<void>;
  getAll(): Promise<DocumentationSession[]>;
  getRecent(limit: number): Promise<DocumentationSession[]>;
  delete(id: number): Promise<void>;
  deleteOlderThan(date: Date): Promise<void>;
  clear(): Promise<void>;
}

export interface IFeedbackRepository {
  save(feedback: Omit<SessionFeedback, 'id'>): Promise<SessionFeedback>;
  getBySession(sessionId: number): Promise<SessionFeedback[]>;
  clear(): Promise<void>;
}
