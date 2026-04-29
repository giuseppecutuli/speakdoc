import type { SessionDraft } from '@/types/session';

/** Default max age for the “restore draft?” banner on cold start. */
export const DRAFT_RESTORE_BANNER_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function draftHasRestoreableContent(draft: SessionDraft): boolean {
  return Boolean(draft.transcription?.trim() || draft.generatedDoc?.trim());
}

/** Whether a draft row should trigger the restore banner (recent + non-empty). */
export function shouldOfferDraftRestoreBanner(draft: SessionDraft, maxAgeMs: number): boolean {
  const age = Date.now() - new Date(draft.savedAt).getTime();
  return age < maxAgeMs && draftHasRestoreableContent(draft);
}
