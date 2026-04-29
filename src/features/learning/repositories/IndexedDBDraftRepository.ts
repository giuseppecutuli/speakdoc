import { db } from '@/utils/db';
import { STORAGE_KEYS } from '@/constants/config';
import type { SessionDraft } from '@/types/session';
import type { IDraftRepository } from './IDraftRepository';
import { build_default_draft_title } from '@/utils/session-naming';

export class IndexedDBDraftRepository implements IDraftRepository {
  begin_new_draft(): void {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_DRAFT_ID);
  }

  async save(draft: Omit<SessionDraft, 'id'>): Promise<SessionDraft> {
    const now = new Date();
    const active_raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_DRAFT_ID);
    if (active_raw) {
      const id = Number(active_raw);
      if (!Number.isNaN(id)) {
        const existing = await db.drafts.get(id);
        if (existing) {
          await db.drafts.update(id, {
            transcription: draft.transcription,
            generatedDoc: draft.generatedDoc,
            format: draft.format,
            speakingLanguage: draft.speakingLanguage,
            outputLanguage: draft.outputLanguage,
            audioBlob: draft.audioBlob,
            savedAt: now,
            updatedAt: now,
          });
          return {
            ...existing,
            ...draft,
            id,
            title: existing.title ?? draft.title,
            savedAt: now,
            updatedAt: now,
          };
        }
      }
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_DRAFT_ID);
    }

    const title = draft.title?.trim() || build_default_draft_title(now);
    const id = await db.drafts.add({
      ...draft,
      title,
      savedAt: now,
      updatedAt: now,
    } as SessionDraft);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_DRAFT_ID, String(id));
    return { ...draft, id: id as number, title, savedAt: now, updatedAt: now };
  }

  async getLatest(): Promise<SessionDraft | undefined> {
    return db.drafts.orderBy('savedAt').last();
  }

  async list_recent(limit: number): Promise<SessionDraft[]> {
    return db.drafts.orderBy('savedAt').reverse().limit(limit).toArray();
  }

  async delete(id: number): Promise<void> {
    await db.drafts.delete(id);
    const active_raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_DRAFT_ID);
    if (active_raw === String(id)) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_DRAFT_ID);
    }
  }

  async clear(): Promise<void> {
    await db.drafts.clear();
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_DRAFT_ID);
  }
}
