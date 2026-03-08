import type { SessionDraft } from '@/types/session';

export interface IDraftRepository {
  save(draft: Omit<SessionDraft, 'id'>): Promise<SessionDraft>;
  getLatest(): Promise<SessionDraft | undefined>;
  clear(): Promise<void>;
}
