import { db } from '@/utils/db';

export class WhisperModelCache {
  async exists(modelId: string): Promise<boolean> {
    const record = await db.whisperModels.get(modelId);
    return record !== undefined;
  }

  async save(modelId: string, data: ArrayBuffer): Promise<void> {
    await db.whisperModels.put({ modelId, data, cachedAt: Date.now() });
  }

  async load(modelId: string): Promise<ArrayBuffer | null> {
    const record = await db.whisperModels.get(modelId);
    return record?.data ?? null;
  }

  async clear(modelId: string): Promise<void> {
    await db.whisperModels.delete(modelId);
  }
}
