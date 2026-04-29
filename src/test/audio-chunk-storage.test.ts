import { describe, it, expect } from 'vitest';
import {
  splitAudioBlobIntoChunks,
  mergeAudioChunks,
  packAudioForStorage,
  packAudioForStorageWithOptions,
  getStoredAudioBlob,
  AUDIO_CHUNK_MAX_BYTES,
} from '@/utils/audio-chunk-storage';
import { AUDIO_BLOB_MAX_BYTES } from '@/constants/draft-limits';

describe('audio-chunk-storage', () => {
  it('splitAudioBlobIntoChunks produces contiguous slices', async () => {
    const data = new Uint8Array(5 * 1024 + 100);
    data[0] = 1;
    data[data.length - 1] = 2;
    const blob = new Blob([data]);
    const chunks = splitAudioBlobIntoChunks(blob, 2 * 1024);
    expect(chunks.length).toBe(3);
    const merged = mergeAudioChunks(chunks, 'application/octet-stream');
    expect(merged.size).toBe(blob.size);
    expect(new Uint8Array(await merged.arrayBuffer())[0]).toBe(1);
  });

  it('packAudioForStorage keeps single blob under limit', () => {
    const blob = new Blob([new Uint8Array(1024)], { type: 'audio/webm' });
    const p = packAudioForStorage(blob);
    expect(p.audioBlob).toBe(blob);
    expect(p.audioChunks).toBeUndefined();
    expect(p.audioMimeType).toBe('audio/webm');
  });

  it('packAudioForStorage splits when over single-blob max', () => {
    const size = AUDIO_BLOB_MAX_BYTES + 500;
    const blob = new Blob([new Uint8Array(size)]);
    const p = packAudioForStorage(blob);
    expect(p.audioBlob).toBeUndefined();
    expect(p.audioChunks?.length).toBeGreaterThanOrEqual(2);
    expect(p.audioChunks?.every((c) => c.size <= AUDIO_CHUNK_MAX_BYTES)).toBe(true);
  });

  it('pack returns empty when slice count would exceed maxChunks', () => {
    const blob = new Blob([new Uint8Array(500)]);
    const p = packAudioForStorageWithOptions(blob, {
      singleMaxBytes: 100,
      chunkMaxBytes: 50,
      maxChunks: 5,
    });
    expect(p).toEqual({});
  });

  it('getStoredAudioBlob prefers chunks when present', () => {
    const a = new Blob(['a'], { type: 'audio/webm' });
    const b = new Blob(['b'], { type: 'audio/webm' });
    const merged = getStoredAudioBlob({
      audioChunks: [a, b],
      audioMimeType: 'audio/webm',
    });
    expect(merged?.size).toBe(2);
  });
});
