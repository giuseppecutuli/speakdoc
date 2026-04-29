import type { SessionDraft } from '@/types/session';

/**
 * Replaces audio fields on a draft row from an incoming save payload (single blob, chunks, or clear).
 */
export function applyAudioToDraftRow(target: SessionDraft, incoming: Omit<SessionDraft, 'id'>): void {
  delete target.audioBlob;
  delete target.audioChunks;
  delete target.audioMimeType;

  if (incoming.audioChunks && incoming.audioChunks.length > 0) {
    target.audioChunks = incoming.audioChunks;
    target.audioMimeType = incoming.audioMimeType;
    return;
  }
  if (incoming.audioBlob && incoming.audioBlob.size > 0) {
    target.audioBlob = incoming.audioBlob;
    target.audioMimeType = incoming.audioMimeType;
  }
}
