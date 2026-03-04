import type { DocumentationSession, SessionFeedback } from '@/types/session';

export interface ISessionRepository {
  save(session: Omit<DocumentationSession, 'id'>): Promise<DocumentationSession>;
  getAll(): Promise<DocumentationSession[]>;
  getRecent(limit: number): Promise<DocumentationSession[]>;
  deleteOlderThan(date: Date): Promise<void>;
  clear(): Promise<void>;
}

export interface IFeedbackRepository {
  save(feedback: Omit<SessionFeedback, 'id'>): Promise<SessionFeedback>;
  getBySession(sessionId: number): Promise<SessionFeedback[]>;
  clear(): Promise<void>;
}
