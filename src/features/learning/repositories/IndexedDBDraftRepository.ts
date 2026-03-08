import { db } from '@/utils/db';
import type { SessionDraft } from '@/types/session';
import type { IDraftRepository } from './IDraftRepository';

export class IndexedDBDraftRepository implements IDraftRepository {
  async save(draft: Omit<SessionDraft, 'id'>): Promise<SessionDraft> {
    await db.drafts.clear();
    const id = await db.drafts.add(draft as SessionDraft);
    return { ...draft, id: id as number };
  }

  async getLatest(): Promise<SessionDraft | undefined> {
    return db.drafts.orderBy('savedAt').last();
  }

  async clear(): Promise<void> {
    await db.drafts.clear();
  }
}
