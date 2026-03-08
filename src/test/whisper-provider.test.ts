import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

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
const makeMockRecorder = () => ({
  start: vi.fn(),
  stop: vi.fn(),
  ondataavailable: null as ((e: { data: Blob }) => void) | null,
  onstop: null as (() => Promise<void>) | null,
  state: 'inactive' as string,
});

let mockMediaRecorder = makeMockRecorder();
const MediaRecorderMock = vi.fn().mockImplementation(function () { return mockMediaRecorder; });
vi.stubGlobal('MediaRecorder', MediaRecorderMock);
vi.stubGlobal('WebAssembly', {});

const mockGetUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [] });
vi.stubGlobal('navigator', {
  mediaDevices: { getUserMedia: mockGetUserMedia },
});

import { WhisperProvider } from '@/features/voice-input/providers/WhisperProvider';

describe('WhisperProvider', () => {
  let provider: WhisperProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    mockMediaRecorder = makeMockRecorder();
    MediaRecorderMock.mockImplementation(function () { return mockMediaRecorder; });
    mockGetUserMedia.mockResolvedValue({ getTracks: () => [] });
    mockServiceInstance.isLoaded.mockReturnValue(false);
    mockServiceInstance.transcribe.mockResolvedValue('Hello world');
    provider = new WhisperProvider();
  });

  afterEach(() => {
    vi.useRealTimers();
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

    it('emits transcription result and fires end callback after stop + onstop', async () => {
      const onResult = vi.fn();
      const onEnd = vi.fn();
      provider.onResult(onResult);
      provider.onEnd(onEnd);

      await provider.start('en');

      // Simulate audio data available
      const fakeBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockMediaRecorder.ondataavailable?.({ data: fakeBlob });

      // stop() sets isStopped = true before onstop fires
      provider.stop();
      await mockMediaRecorder.onstop?.();

      expect(mockServiceInstance.transcribe).toHaveBeenCalledWith(expect.any(Blob), undefined, expect.any(String));
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

      provider.stop();
      await mockMediaRecorder.onstop?.();

      expect(onError).toHaveBeenCalledWith(expect.stringContaining('WASM crash'));
      expect(onEnd).toHaveBeenCalled();
    });

    it('does not fire endCallback if stop has not been called', async () => {
      const onEnd = vi.fn();
      provider.onEnd(onEnd);

      await provider.start('en');
      const fakeBlob = new Blob(['audio'], { type: 'audio/webm' });
      mockMediaRecorder.ondataavailable?.({ data: fakeBlob });

      // onstop fires without stop() (intermediate rotation chunk)
      await mockMediaRecorder.onstop?.();

      expect(onEnd).not.toHaveBeenCalled();
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

    it('does not fire endCallback after abort', async () => {
      const onEnd = vi.fn();
      provider.onEnd(onEnd);
      await provider.start('en');
      provider.abort();
      mockMediaRecorder.ondataavailable?.({ data: new Blob(['audio']) });
      // onstop fires but aborted flag prevents transcription and endCallback
      await mockMediaRecorder.onstop?.();
      expect(onEnd).not.toHaveBeenCalled();
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

  describe('chunked recording (interval rotation)', () => {
    it('creates a new MediaRecorder after WHISPER_CHUNK_INTERVAL_MS elapses', async () => {
      vi.useFakeTimers();
      await provider.start('en');
      expect(MediaRecorderMock).toHaveBeenCalledTimes(1);

      // Swap mock so the second recorder is different
      const secondRecorder = makeMockRecorder();
      MediaRecorderMock.mockImplementationOnce(function () { return secondRecorder; });

      vi.advanceTimersByTime(15_000);

      // Interval triggers rotateRecorder: old stop + new MediaRecorder created
      expect(mockMediaRecorder.stop).toHaveBeenCalled();
      expect(MediaRecorderMock).toHaveBeenCalledTimes(2);
    });

    it('clears interval timer on stop()', async () => {
      vi.useFakeTimers();
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

      await provider.start('en');
      provider.stop();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('clears interval timer on abort()', async () => {
      vi.useFakeTimers();
      const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');

      await provider.start('en');
      provider.abort();

      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('transcribes chunks serially — second transcription waits for first', async () => {
      vi.useFakeTimers();
      const order: string[] = [];
      let resolveFirst!: () => void;
      const firstDone = new Promise<void>((res) => { resolveFirst = res; });

      mockServiceInstance.transcribe
        .mockImplementationOnce(async () => {
          await firstDone;
          order.push('first');
          return 'chunk one';
        })
        .mockImplementationOnce(async () => {
          order.push('second');
          return 'chunk two';
        });

      provider.onResult(vi.fn());
      await provider.start('en');

      const firstRecorder = mockMediaRecorder;

      // Set up second recorder before interval fires
      const secondRecorder = makeMockRecorder();
      MediaRecorderMock.mockImplementationOnce(function () { return secondRecorder; });

      // Advance timers → rotateRecorder fires: stops first, creates+starts second
      vi.advanceTimersByTime(30_000);

      // Both recorders now have their onstop handlers registered by createRecorder
      firstRecorder.ondataavailable?.({ data: new Blob(['a']) });
      const firstOnstoPromise = firstRecorder.onstop?.();

      secondRecorder.ondataavailable?.({ data: new Blob(['b']) });
      provider.stop(); // sets isStopped = true
      const secondOnstoPromise = secondRecorder.onstop?.();

      resolveFirst();
      await firstOnstoPromise;
      await secondOnstoPromise;

      expect(order).toEqual(['first', 'second']);
    });
  });
});
