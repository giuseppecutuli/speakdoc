import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { WhisperModelSize } from '@/constants/whisper-config';

const { mockPipeline, mockPipelineInstance } = vi.hoisted(() => {
  const mockPipelineInstance = { __call: vi.fn() };
  const mockPipeline = vi.fn();
  return { mockPipeline, mockPipelineInstance };
});

vi.mock('@xenova/transformers', () => ({
  pipeline: mockPipeline,
  env: { allowLocalModels: false },
}));

vi.mock('@/features/voice-input/whisper-model-cache', () => ({
  WhisperModelCache: vi.fn().mockImplementation(() => ({
    exists: vi.fn().mockResolvedValue(false),
    save: vi.fn().mockResolvedValue(undefined),
    load: vi.fn().mockResolvedValue(null),
    clear: vi.fn().mockResolvedValue(undefined),
  })),
}));

import { WhisperService } from '@/features/voice-input/whisper.service';

describe('WhisperService', () => {
  let service: WhisperService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WhisperService();
    mockPipeline.mockResolvedValue(mockPipelineInstance);
    mockPipelineInstance.__call.mockResolvedValue({ text: ' Hello world' });
  });

  describe('isLoaded()', () => {
    it('returns false before loading', () => {
      expect(service.isLoaded()).toBe(false);
    });

    it('returns true after successful load', async () => {
      await service.load('tiny');
      expect(service.isLoaded()).toBe(true);
    });
  });

  describe('load()', () => {
    it('calls pipeline with correct modelId for tiny', async () => {
      await service.load('tiny');
      expect(mockPipeline).toHaveBeenCalledWith(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny',
        expect.any(Object),
      );
    });

    it('calls pipeline with base model when size is base', async () => {
      await service.load('base');
      expect(mockPipeline).toHaveBeenCalledWith(
        'automatic-speech-recognition',
        'Xenova/whisper-base',
        expect.any(Object),
      );
    });

    it('invokes progress callback during load', async () => {
      const onProgress = vi.fn();
      mockPipeline.mockImplementation(
        (_task: string, _model: string, opts: { progress_callback?: (p: { status: string; progress: number }) => void }) => {
          opts.progress_callback?.({ status: 'progress', progress: 50 });
          return Promise.resolve(mockPipelineInstance);
        },
      );
      await service.load('tiny', onProgress);
      expect(onProgress).toHaveBeenCalledWith(50);
    });

    it('does not reload if already loaded with same model', async () => {
      await service.load('tiny');
      await service.load('tiny');
      expect(mockPipeline).toHaveBeenCalledTimes(1);
    });

    it('reloads if model size changes', async () => {
      await service.load('tiny');
      await service.load('base');
      expect(mockPipeline).toHaveBeenCalledTimes(2);
    });

    it('throws on pipeline initialization error', async () => {
      mockPipeline.mockRejectedValueOnce(new Error('Network error'));
      await expect(service.load('tiny')).rejects.toThrow('Network error');
      expect(service.isLoaded()).toBe(false);
    });
  });

  describe('transcribe()', () => {
    it('throws if not loaded', async () => {
      const blob = new Blob(['audio'], { type: 'audio/webm' });
      await expect(service.transcribe(blob)).rejects.toThrow('not loaded');
    });

    it('returns trimmed transcription text', async () => {
      await service.load('tiny');
      const blob = new Blob(['audio'], { type: 'audio/webm' });
      const result = await service.transcribe(blob);
      expect(result).toBe('Hello world');
    });

    it('returns empty string for silent/empty audio', async () => {
      mockPipelineInstance.__call.mockResolvedValueOnce({ text: '' });
      await service.load('tiny');
      const blob = new Blob([], { type: 'audio/webm' });
      const result = await service.transcribe(blob);
      expect(result).toBe('');
    });

    it('throws on transcription error', async () => {
      mockPipelineInstance.__call.mockRejectedValueOnce(new Error('WASM crash'));
      await service.load('tiny');
      const blob = new Blob(['audio'], { type: 'audio/webm' });
      await expect(service.transcribe(blob)).rejects.toThrow('WASM crash');
    });
  });

  describe('unload()', () => {
    it('resets loaded state', async () => {
      await service.load('tiny');
      service.unload();
      expect(service.isLoaded()).toBe(false);
    });

    it('allows reloading after unload', async () => {
      await service.load('tiny');
      service.unload();
      await service.load('tiny');
      expect(mockPipeline).toHaveBeenCalledTimes(2);
    });
  });

  describe('getLoadedModelSize()', () => {
    it('returns null before loading', () => {
      expect(service.getLoadedModelSize()).toBeNull();
    });

    it('returns the loaded model size', async () => {
      await service.load('small');
      expect(service.getLoadedModelSize()).toBe<WhisperModelSize>('small');
    });
  });
});
