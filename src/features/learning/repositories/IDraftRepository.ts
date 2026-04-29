import type { SessionDraft } from '@/types/session';

export interface IDraftRepository {
  /** Clears the active draft pointer so the next `save` creates a new row. */
  begin_new_draft(): void;
  save(draft: Omit<SessionDraft, 'id'>): Promise<SessionDraft>;
  getLatest(): Promise<SessionDraft | undefined>;
  list_recent(limit: number): Promise<SessionDraft[]>;
  delete(id: number): Promise<void>;
  clear(): Promise<void>;
}
