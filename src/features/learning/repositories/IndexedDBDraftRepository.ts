import { db } from '@/utils/db';
import { STORAGE_KEYS } from '@/constants/config';
import type { SessionDraft } from '@/types/session';
import type { IDraftRepository } from './IDraftRepository';
import { buildDefaultDraftTitle } from '@/utils/session-naming';
import { applyAudioToDraftRow } from './draft-audio-merge';

export class IndexedDBDraftRepository implements IDraftRepository {
  beginNewDraft(): void {
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
          const row: SessionDraft = {
            ...existing,
            transcription: draft.transcription,
            generatedDoc: draft.generatedDoc,
            format: draft.format,
            speakingLanguage: draft.speakingLanguage,
            outputLanguage: draft.outputLanguage,
            title: existing.title ?? draft.title,
            savedAt: now,
            updatedAt: now,
          };
          applyAudioToDraftRow(row, draft);
          await db.drafts.put(row);
          return row;
        }
      }
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_DRAFT_ID);
    }

    const title = draft.title?.trim() || buildDefaultDraftTitle(now);
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

  async listRecent(limit: number): Promise<SessionDraft[]> {
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
