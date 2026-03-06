import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import type { WhisperModelSize } from '@/constants/whisper-config';
import { WhisperService } from '@/features/voice-input/whisper.service';

// ---------------------------------------------------------------------------
// Class-based Web Audio API mocks (jsdom does not provide these)
// ---------------------------------------------------------------------------
class MockAudioContext {
  decodeAudioData(_buf: ArrayBuffer) {
    return Promise.resolve({
      duration: 1,
      sampleRate: 44100,
      numberOfChannels: 1,
      getChannelData: () => new Float32Array([0.1, 0.2]),
    });
  }
  close() {}
}

class MockOfflineAudioContext {
  destination = {};
  createBufferSource() {
    return { buffer: null as unknown, connect: vi.fn(), start: vi.fn() };
  }
  startRendering() {
    return Promise.resolve({
      getChannelData: () => new Float32Array([0.1, 0.2]),
    });
  }
}

vi.stubGlobal('AudioContext', MockAudioContext);
vi.stubGlobal('OfflineAudioContext', MockOfflineAudioContext);

// ---------------------------------------------------------------------------
// Simulated Worker factory
// ---------------------------------------------------------------------------
type MessageHandler = (e: MessageEvent) => void;

function createMockWorker() {
  const handlers: MessageHandler[] = [];

  return {
    postMessage: vi.fn() as Mock,
    addEventListener: vi.fn((event: string, handler: MessageHandler) => {
      if (event === 'message') handlers.push(handler);
    }),
    removeEventListener: vi.fn((event: string, handler: MessageHandler) => {
      if (event === 'message') {
        const i = handlers.indexOf(handler);
        if (i >= 0) handlers.splice(i, 1);
      }
    }),
    terminate: vi.fn(),
    simulate(data: unknown) {
      [...handlers].forEach((h) => h(new MessageEvent('message', { data })));
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('WhisperService', () => {
  let mockWorker: ReturnType<typeof createMockWorker>;
  let service: WhisperService;

  /** Load the service synchronously using simulated worker replies. */
  async function loadService(size: WhisperModelSize = 'tiny') {
    const promise = service.load(size);
    mockWorker.simulate({ type: 'load:done' });
    await promise;
  }

  /**
   * Transcribe a blob, auto-replying via the worker mock.
   * The reply is injected via mockImplementation so it fires after
   * the async audio-decoding chain inside transcribe() completes.
   */
  async function transcribeWithReply(blob: Blob, text = 'Hello world') {
    mockWorker.postMessage.mockImplementationOnce(
      (msg: { type: string; payload: { id: number } }) => {
        if (msg.type === 'transcribe') {
          mockWorker.simulate({ type: 'transcribe:done', id: msg.payload.id, payload: text });
        }
      },
    );
    return service.transcribe(blob);
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockWorker = createMockWorker();
    service = new WhisperService(() => mockWorker as unknown as Worker);
  });

  // -------------------------------------------------------------------------
  describe('isLoaded()', () => {
    it('returns false before loading', () => {
      expect(service.isLoaded()).toBe(false);
    });

    it('returns true after successful load', async () => {
      await loadService();
      expect(service.isLoaded()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe('load()', () => {
    it('posts load message with correct modelId for tiny', async () => {
      await loadService('tiny');
      expect(mockWorker.postMessage).toHaveBeenCalledWith({
        type: 'load',
        payload: { size: 'tiny', modelId: 'Xenova/whisper-tiny' },
      });
    });

    it('posts load message with correct modelId for base', async () => {
      await loadService('base');
      expect(mockWorker.postMessage).toHaveBeenCalledWith({
        type: 'load',
        payload: { size: 'base', modelId: 'Xenova/whisper-base' },
      });
    });

    it('invokes onProgress when worker sends load:progress', async () => {
      const onProgress = vi.fn();
      const promise = service.load('tiny', onProgress);
      mockWorker.simulate({ type: 'load:progress', payload: 50 });
      mockWorker.simulate({ type: 'load:done' });
      await promise;
      expect(onProgress).toHaveBeenCalledWith(50);
    });

    it('does not reload if already loaded with same model', async () => {
      await loadService('tiny');
      await service.load('tiny'); // skip — no second postMessage
      expect(mockWorker.postMessage).toHaveBeenCalledTimes(1);
    });

    it('reloads when model size changes', async () => {
      await loadService('tiny');
      await loadService('base');
      expect(mockWorker.postMessage).toHaveBeenCalledTimes(2);
    });

    it('rejects on load:error and leaves isLoaded false', async () => {
      const promise = service.load('tiny');
      mockWorker.simulate({ type: 'load:error', payload: 'Network error' });
      await expect(promise).rejects.toThrow('Network error');
      expect(service.isLoaded()).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  describe('transcribe()', () => {
    it('throws if not loaded', async () => {
      const blob = new Blob(['audio'], { type: 'audio/webm' });
      await expect(service.transcribe(blob)).rejects.toThrow('not loaded');
    });

    it('returns trimmed transcription text', async () => {
      await loadService();
      const blob = new Blob(['audio'], { type: 'audio/webm' });
      const result = await transcribeWithReply(blob, 'Hello world');
      expect(result).toBe('Hello world');
    });

    it('returns empty string for silent audio', async () => {
      await loadService();
      const blob = new Blob([], { type: 'audio/webm' });
      const result = await transcribeWithReply(blob, '');
      expect(result).toBe('');
    });

    it('rejects on transcribe:error', async () => {
      await loadService();
      const blob = new Blob(['audio'], { type: 'audio/webm' });

      mockWorker.postMessage.mockImplementationOnce(
        (msg: { type: string; payload: { id: number } }) => {
          if (msg.type === 'transcribe') {
            mockWorker.simulate({ type: 'transcribe:error', id: msg.payload.id, payload: 'WASM crash' });
          }
        },
      );

      await expect(service.transcribe(blob)).rejects.toThrow('WASM crash');
    });

    it('ignores transcribe responses with wrong id', async () => {
      await loadService();
      const blob = new Blob(['audio'], { type: 'audio/webm' });

      mockWorker.postMessage.mockImplementationOnce(
        (msg: { type: string; payload: { id: number } }) => {
          if (msg.type === 'transcribe') {
            // wrong id first, then correct id
            mockWorker.simulate({ type: 'transcribe:done', id: msg.payload.id + 99, payload: 'wrong' });
            mockWorker.simulate({ type: 'transcribe:done', id: msg.payload.id, payload: 'correct' });
          }
        },
      );

      const result = await service.transcribe(blob);
      expect(result).toBe('correct');
    });

    it('sends the audio buffer to the worker as a transfer', async () => {
      await loadService();
      const blob = new Blob(['audio'], { type: 'audio/webm' });

      mockWorker.postMessage.mockImplementationOnce(
        (msg: { type: string; payload: { id: number; buffer: ArrayBuffer } }) => {
          if (msg.type === 'transcribe') {
            expect(msg.payload.buffer).toBeInstanceOf(ArrayBuffer);
            mockWorker.simulate({ type: 'transcribe:done', id: msg.payload.id, payload: '' });
          }
        },
      );

      await service.transcribe(blob);
    });
  });

  // -------------------------------------------------------------------------
  describe('unload()', () => {
    it('resets loaded state', async () => {
      await loadService();
      service.unload();
      expect(service.isLoaded()).toBe(false);
    });

    it('posts unload message to worker', async () => {
      await loadService();
      service.unload();
      expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: 'unload' });
    });

    it('allows reloading after unload', async () => {
      await loadService();
      service.unload();
      await loadService();
      expect(service.isLoaded()).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  describe('getLoadedModelSize()', () => {
    it('returns null before loading', () => {
      expect(service.getLoadedModelSize()).toBeNull();
    });

    it('returns the loaded model size', async () => {
      await loadService('small');
      expect(service.getLoadedModelSize()).toBe<WhisperModelSize>('small');
    });

    it('returns null after unload', async () => {
      await loadService();
      service.unload();
      expect(service.getLoadedModelSize()).toBeNull();
    });
  });
});
