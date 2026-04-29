import { AUDIO_BLOB_MAX_BYTES } from '@/constants/draft-limits';

/**
 * Max size per IndexedDB-stored Blob slice when splitting oversized recordings.
 * Keep below typical per-value limits; total audio can span many chunks.
 */
export const AUDIO_CHUNK_MAX_BYTES = 20 * 1024 * 1024;

/** Safety cap on chunk count to avoid exhausting IndexedDB quota (20 MB × 80 ≈ 1.6 GB). */
export const MAX_AUDIO_CHUNKS = 80;

export type PackedAudioFields = {
  audioBlob?: Blob;
  audioChunks?: Blob[];
  audioMimeType?: string;
};

/** Shape shared by session rows and drafts for reassembly. */
export type AudioStorageSource = {
  audioBlob?: Blob;
  audioChunks?: Blob[];
  audioMimeType?: string;
};

/**
 * Splits a Blob into contiguous slices (no re-encoding).
 */
export function splitAudioBlobIntoChunks(blob: Blob, chunkMaxBytes: number): Blob[] {
  const chunks: Blob[] = [];
  for (let offset = 0; offset < blob.size; offset += chunkMaxBytes) {
    chunks.push(blob.slice(offset, Math.min(offset + chunkMaxBytes, blob.size)));
  }
  return chunks;
}

export function mergeAudioChunks(chunks: Blob[], mimeType: string): Blob {
  return new Blob(chunks, { type: mimeType });
}

export type PackAudioOptions = {
  singleMaxBytes: number;
  chunkMaxBytes: number;
  maxChunks: number;
};

const defaultPackOptions = (): PackAudioOptions => ({
  singleMaxBytes: AUDIO_BLOB_MAX_BYTES,
  chunkMaxBytes: AUDIO_CHUNK_MAX_BYTES,
  maxChunks: MAX_AUDIO_CHUNKS,
});

/**
 * Packs mic audio for IndexedDB: single blob under `singleMaxBytes`, otherwise slices of `chunkMaxBytes`.
 * Returns `{}` if missing, empty, or if the slice count would exceed `maxChunks`.
 */
export function packAudioForStorageWithOptions(
  blob: Blob | null | undefined,
  opts: PackAudioOptions,
): PackedAudioFields {
  if (!blob || blob.size === 0) return {};
  const mimeType = blob.type || 'audio/webm';
  if (blob.size <= opts.singleMaxBytes) {
    return { audioBlob: blob, audioMimeType: mimeType };
  }
  const chunks = splitAudioBlobIntoChunks(blob, opts.chunkMaxBytes);
  if (chunks.length > opts.maxChunks) {
    return {};
  }
  return { audioChunks: chunks, audioMimeType: mimeType };
}

/** Default limits from {@link AUDIO_BLOB_MAX_BYTES}, {@link AUDIO_CHUNK_MAX_BYTES}, {@link MAX_AUDIO_CHUNKS}. */
export function packAudioForStorage(blob: Blob | null | undefined): PackedAudioFields {
  return packAudioForStorageWithOptions(blob, defaultPackOptions());
}

/**
 * Rebuilds one playable Blob from either a single stored blob or chunked storage.
 */
export function getStoredAudioBlob(source: AudioStorageSource): Blob | null {
  const chunks = source.audioChunks;
  if (chunks && chunks.length > 0) {
    return mergeAudioChunks(chunks, source.audioMimeType || 'audio/webm');
  }
  const single = source.audioBlob;
  if (single && single.size > 0) return single;
  return null;
}
