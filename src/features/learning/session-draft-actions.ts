import { STORAGE_KEYS } from '@/constants/config';
import { useRecordingStore } from '@/hooks/useRecordingStore';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { draftRepository } from '@/utils/repositories';
import { packAudioForStorage } from '@/utils/audio-chunk-storage';
import type { SessionDraft } from '@/types/session';

/** Active draft row id from localStorage, if any. */
export function getActiveDraftId(): number | null {
  const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_DRAFT_ID);
  if (!raw) return null;
  const id = Number(raw);
  if (Number.isNaN(id)) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_DRAFT_ID);
    return null;
  }
  return id;
}

/** True when there is transcription or generated doc worth persisting as a draft. */
export function hasPersistableDraftContent(): boolean {
  const t = useRecordingStore.getState().transcription.trim();
  const d = useDocumentationStore.getState().formattedOutput.trim();
  return Boolean(t || d);
}

/** Writes the current workspace to IndexedDB immediately (same payload as debounced draft sync). */
export async function persistCurrentDraftNow(): Promise<SessionDraft | undefined> {
  const transcription = useRecordingStore.getState().transcription;
  const audioBlob = useRecordingStore.getState().audioBlob;
  const formattedOutput = useDocumentationStore.getState().formattedOutput;
  const selectedFormat = useDocumentationStore.getState().selectedFormat;
  const speakingLanguage = useLanguageStore.getState().speakingLanguage;
  const outputLanguage = useLanguageStore.getState().outputLanguage;
  if (!transcription.trim() && !formattedOutput.trim()) return undefined;
  const audioPack = packAudioForStorage(audioBlob ?? null);
  return draftRepository.save({
    transcription,
    generatedDoc: formattedOutput,
    format: selectedFormat,
    speakingLanguage,
    outputLanguage,
    ...audioPack,
    savedAt: new Date(),
  });
}

/** Removes the active draft row if `ACTIVE_DRAFT_ID` points at one. */
export async function deleteActiveDraftIfAny(): Promise<void> {
  const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_DRAFT_ID);
  if (!raw) return;
  const id = Number(raw);
  if (Number.isNaN(id)) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_DRAFT_ID);
    return;
  }
  await draftRepository.delete(id).catch(() => undefined);
}

export function resetWorkspaceStores(): void {
  useRecordingStore.getState().reset();
  useDocumentationStore.getState().reset();
  useLanguageStore.getState().unlockSession();
}

/**
 * Persists current content when non-empty, clears the active draft pointer, then resets
 * recording + documentation stores (blank canvas).
 */
export async function beginNewWorkspaceSession(): Promise<void> {
  if (hasPersistableDraftContent()) {
    await persistCurrentDraftNow();
  }
  draftRepository.beginNewDraft();
  resetWorkspaceStores();
}
