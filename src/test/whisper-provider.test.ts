import { describe, it, expect, beforeEach, vi } from 'vitest';

const { mockServiceInstance } = vi.hoisted(() => {
  const mockServiceInstance = {
    isLoaded: vi.fn().mockReturnValue(false),
    load: vi.fn().mockResolvedValue(undefined),
    transcribe: vi.fn().mockResolvedValue('Hello world'),
    unload: vi.fn(),
    getLoadedModelSize: vi.fn().mockReturnValue(null),
  };
  return { mockServiceInstance };
});

vi.mock('@/features/voice-input/whisper.service', () => {
  function MockWhisperService(this: unknown) {
    Object.assign(this as object, mockServiceInstance);
  }
  return { WhisperService: MockWhisperService };
});

// Provide MediaRecorder stub in test environment
const mockMediaRecorder = {
  start: vi.fn(),
  stop: vi.fn(),
  ondataavailable: null as ((e: { data: Blob }) => void) | null,
  onstop: null as (() => void) | null,
  state: 'inactive' as string,
};
vi.stubGlobal('MediaRecorder', vi.fn().mockImplementation(function () { return mockMediaRecorder; }));
vi.stubGlobal('WebAssembly', {});
vi.stubGlobal('navigator', {
  mediaDevices: {
    getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [] }),
  },
});

import { WhisperProvider } from '@/features/voice-input/providers/WhisperProvider';

describe('WhisperProvider', () => {
  let provider: WhisperProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    mockMediaRecorder.ondataavailable = null;
    mockMediaRecorder.onstop = null;
    mockServiceInstance.isLoaded.mockReturnValue(false);
    mockServiceInstance.transcribe.mockResolvedValue('Hello world');
    provider = new WhisperProvider();
  });

  it('has name "whisper"', () => {
    expect(provider.name).toBe('whisper');
  });

  describe('isAvailable()', () => {
    it('returns true when WebAssembly and MediaRecorder are available', () => {
      expect(provider.isAvailable()).toBe(true);
    });
  });

  describe('isConfigured()', () => {
    it('returns false when model is not loaded', () => {
      mockServiceInstance.isLoaded.mockReturnValue(false);
      expect(provider.isConfigured()).toBe(false);
    });

    it('returns true when model is loaded', () => {
      mockServiceInstance.isLoaded.mockReturnValue(true);
      expect(provider.isConfigured()).toBe(true);
    });
  });

  describe('onResult / onError / onEnd callbacks', () => {
    it('registers result callback without throwing', () => {
      expect(() => provider.onResult(vi.fn())).not.toThrow();
    });

    it('registers error callback without throwing', () => {
      expect(() => provider.onError(vi.fn())).not.toThrow();
    });

    it('registers end callback without throwing', () => {
      expect(() => provider.onEnd(vi.fn())).not.toThrow();
    });
  });

  describe('start() / stop()', () => {
    it('requests microphone access on start', async () => {
      await provider.start('en');
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    });

    it('creates MediaRecorder after getUserMedia resolves', async () => {
      await provider.start('en');
      expect(MediaRecorder).toHaveBeenCalled();
    });

    it('calls stop on the MediaRecorder when stop() is called', async () => {
      await provider.start('en');
      provider.stop();
      expect(mockMediaRecorder.stop).toHaveBeenCalled();
    });

    it('emits transcription result and fires end callback after recording stops', async () => {
      const onResult = vi.fn();
      const onEnd = vi.fn();
      provider.onResult(onResult);
      provider.onEnd(onEnd);

      await provider.start('en');

      // Simulate audio data available
      const fakeBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockMediaRecorder.ondataavailable?.({ data: fakeBlob });

      // Simulate MediaRecorder stop event
      await mockMediaRecorder.onstop?.();

      expect(mockServiceInstance.transcribe).toHaveBeenCalledWith(expect.any(Blob));
      expect(onResult).toHaveBeenCalledWith({ transcript: 'Hello world', isFinal: true });
      expect(onEnd).toHaveBeenCalled();
    });

    it('fires error callback when transcription throws', async () => {
      const onError = vi.fn();
      const onEnd = vi.fn();
      provider.onError(onError);
      provider.onEnd(onEnd);
      mockServiceInstance.transcribe.mockRejectedValueOnce(new Error('WASM crash'));

      await provider.start('en');
      const fakeBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockMediaRecorder.ondataavailable?.({ data: fakeBlob });
      await mockMediaRecorder.onstop?.();

      expect(onError).toHaveBeenCalledWith(expect.stringContaining('WASM crash'));
      expect(onEnd).toHaveBeenCalled();
    });
  });

  describe('abort()', () => {
    it('stops recording without emitting a result', async () => {
      const onResult = vi.fn();
      provider.onResult(onResult);
      await provider.start('en');
      provider.abort();
      expect(onResult).not.toHaveBeenCalled();
    });
  });

  describe('setModelSize()', () => {
    it('loads the service with the given model size on configure()', async () => {
      const onProgress = vi.fn();
      provider.setModelSize('base');
      await provider.configure(onProgress);
      expect(mockServiceInstance.load).toHaveBeenCalledWith('base', onProgress);
    });
  });
});
