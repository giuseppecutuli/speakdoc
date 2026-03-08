import { db } from '@/utils/db';
import type { DocumentationSession, SessionFeedback } from '@/types/session';
import type { ISessionRepository, IFeedbackRepository } from './ISessionRepository';

export class IndexedDBSessionRepository implements ISessionRepository {
  async save(session: Omit<DocumentationSession, 'id'>): Promise<DocumentationSession> {
    const id = await db.sessions.add(session as DocumentationSession);
    return { ...session, id: id as number };
  }

  getAll(): Promise<DocumentationSession[]> {
    return db.sessions.toArray();
  }

  getRecent(limit: number): Promise<DocumentationSession[]> {
    return db.sessions.orderBy('createdAt').reverse().limit(limit).toArray();
  }

  async update(id: number, changes: Partial<DocumentationSession>): Promise<void> {
    await db.sessions.update(id, changes);
  }

  async delete(id: number): Promise<void> {
    await db.sessions.delete(id);
  }

  async deleteOlderThan(date: Date): Promise<void> {
    await db.sessions.where('createdAt').below(date).delete();
  }

  async clear(): Promise<void> {
    await db.sessions.clear();
  }
}

export class IndexedDBFeedbackRepository implements IFeedbackRepository {
  async save(feedback: Omit<SessionFeedback, 'id'>): Promise<SessionFeedback> {
    const id = await db.feedback.add(feedback as SessionFeedback);
    return { ...feedback, id: id as number };
  }

  getBySession(sessionId: number): Promise<SessionFeedback[]> {
    return db.feedback.where('sessionId').equals(sessionId).toArray();
  }

  async clear(): Promise<void> {
    await db.feedback.clear();
  }
}
