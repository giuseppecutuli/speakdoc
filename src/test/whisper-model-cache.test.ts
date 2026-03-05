import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Dexie db before importing the cache
vi.mock('@/utils/db', () => {
  const store = new Map<string, { modelId: string; data: ArrayBuffer; cachedAt: number }>();
  return {
    db: {
      whisperModels: {
        get: vi.fn(async (modelId: string) => store.get(modelId) ?? undefined),
        put: vi.fn(async (record: { modelId: string; data: ArrayBuffer; cachedAt: number }) => {
          store.set(record.modelId, record);
        }),
        delete: vi.fn(async (modelId: string) => {
          store.delete(modelId);
        }),
        clear: vi.fn(async () => store.clear()),
        _store: store,
      },
    },
  };
});

import { WhisperModelCache } from '@/features/voice-input/whisper-model-cache';
import { db } from '@/utils/db';

const mockStore = (db.whisperModels as unknown as { _store: Map<string, unknown> })._store;

describe('WhisperModelCache', () => {
  let cache: WhisperModelCache;

  beforeEach(() => {
    mockStore.clear();
    vi.clearAllMocks();
    cache = new WhisperModelCache();
  });

  describe('exists()', () => {
    it('returns false when model is not cached', async () => {
      expect(await cache.exists('Xenova/whisper-tiny')).toBe(false);
    });

    it('returns true after saving a model', async () => {
      await cache.save('Xenova/whisper-tiny', new ArrayBuffer(8));
      expect(await cache.exists('Xenova/whisper-tiny')).toBe(true);
    });
  });

  describe('save()', () => {
    it('stores model data in IndexedDB', async () => {
      const data = new ArrayBuffer(16);
      await cache.save('Xenova/whisper-tiny', data);
      expect(db.whisperModels.put).toHaveBeenCalledWith(
        expect.objectContaining({ modelId: 'Xenova/whisper-tiny', data }),
      );
    });

    it('overwrites existing entry for the same modelId', async () => {
      await cache.save('Xenova/whisper-tiny', new ArrayBuffer(8));
      const newData = new ArrayBuffer(16);
      await cache.save('Xenova/whisper-tiny', newData);
      const record = await db.whisperModels.get('Xenova/whisper-tiny');
      expect(record?.data).toBe(newData);
    });
  });

  describe('load()', () => {
    it('returns null when model is not cached', async () => {
      expect(await cache.load('Xenova/whisper-tiny')).toBeNull();
    });

    it('returns the stored ArrayBuffer', async () => {
      const data = new ArrayBuffer(32);
      await cache.save('Xenova/whisper-tiny', data);
      const result = await cache.load('Xenova/whisper-tiny');
      expect(result).toBe(data);
    });
  });

  describe('clear()', () => {
    it('removes a specific model from cache', async () => {
      await cache.save('Xenova/whisper-tiny', new ArrayBuffer(8));
      await cache.clear('Xenova/whisper-tiny');
      expect(await cache.exists('Xenova/whisper-tiny')).toBe(false);
    });

    it('does not affect other cached models', async () => {
      await cache.save('Xenova/whisper-tiny', new ArrayBuffer(8));
      await cache.save('Xenova/whisper-base', new ArrayBuffer(8));
      await cache.clear('Xenova/whisper-tiny');
      expect(await cache.exists('Xenova/whisper-base')).toBe(true);
    });
  });

  describe('error handling', () => {
    it('propagates IndexedDB errors from save()', async () => {
      vi.mocked(db.whisperModels.put).mockRejectedValueOnce(new Error('QuotaExceededError'));
      await expect(cache.save('Xenova/whisper-tiny', new ArrayBuffer(8))).rejects.toThrow(
        'QuotaExceededError',
      );
    });

    it('propagates IndexedDB errors from load()', async () => {
      vi.mocked(db.whisperModels.get).mockRejectedValueOnce(new Error('DB error'));
      await expect(cache.load('Xenova/whisper-tiny')).rejects.toThrow('DB error');
    });
  });
});
