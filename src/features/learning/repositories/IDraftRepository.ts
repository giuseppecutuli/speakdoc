import type { SessionDraft } from '@/types/session';

export interface IDraftRepository {
  /** Clears the active draft pointer so the next `save` creates a new row. */
  beginNewDraft(): void;
  save(draft: Omit<SessionDraft, 'id'>): Promise<SessionDraft>;
  getLatest(): Promise<SessionDraft | undefined>;
  getById(id: number): Promise<SessionDraft | undefined>;
  /** Shallow merge into an existing draft row; bumps `updatedAt`. */
  update(id: number, changes: Partial<Omit<SessionDraft, 'id' | 'savedAt'>>): Promise<void>;
  listRecent(limit: number): Promise<SessionDraft[]>;
  delete(id: number): Promise<void>;
  clear(): Promise<void>;
}
