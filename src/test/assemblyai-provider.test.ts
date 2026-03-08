import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssemblyAIProvider } from '@/features/voice-input/providers/AssemblyAIProvider';

// All hoisted so they're available inside vi.mock factory
const { mockTranscriber, mockStreamingTranscriber, mockAssemblyAI } = vi.hoisted(() => {
  const mockTranscriber = {
    on: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    sendAudio: vi.fn(),
    close: vi.fn().mockResolvedValue(undefined),
  };
  const mockStreamingTranscriber = vi.fn(() => mockTranscriber);
  const mockAssemblyAI = vi.fn(function () {
    return { streaming: { transcriber: mockStreamingTranscriber } };
  });
  return { mockTranscriber, mockStreamingTranscriber, mockAssemblyAI };
});

vi.mock('assemblyai', () => ({ AssemblyAI: mockAssemblyAI }));

// --- Mock browser APIs ---
const mockGetUserMedia = vi.fn();
const mockStream = { getTracks: vi.fn(() => [{ stop: vi.fn() }]) };

const mockWorkletPort = {
  onmessage: null as ((e: MessageEvent) => void) | null,
};

const mockWorkletNode = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  port: mockWorkletPort,
};

const mockAudioWorklet = {
  addModule: vi.fn().mockResolvedValue(undefined),
};

const mockAudioContext = {
  createMediaStreamSource: vi.fn(() => ({ connect: vi.fn() })),
  audioWorklet: mockAudioWorklet,
  close: vi.fn().mockResolvedValue(undefined),
  destination: {},
};

vi.stubGlobal('AudioContext', vi.fn(() => mockAudioContext));
vi.stubGlobal('AudioWorkletNode', vi.fn(() => mockWorkletNode));
vi.stubGlobal('navigator', {
  mediaDevices: { getUserMedia: mockGetUserMedia },
});

/** Capture event listeners registered via transcriber.on(event, handler) */
function getTranscriberListeners() {
  const listeners: Record<string, (...args: unknown[]) => void> = {};
  for (const call of mockTranscriber.on.mock.calls) {
    const [event, handler] = call as [string, (...args: unknown[]) => void];
    listeners[event] = handler;
  }
  return listeners;
}

describe('AssemblyAIProvider', () => {
  let provider: AssemblyAIProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();

    // Re-set implementations after clearAllMocks
    mockGetUserMedia.mockResolvedValue(mockStream);
    mockTranscriber.connect.mockResolvedValue(undefined);
    mockTranscriber.close.mockResolvedValue(undefined);
    mockStreamingTranscriber.mockReturnValue(mockTranscriber);
    mockAssemblyAI.mockImplementation(function () {
      return { streaming: { transcriber: mockStreamingTranscriber } };
    });
    mockAudioContext.close.mockResolvedValue(undefined);
    mockAudioWorklet.addModule.mockResolvedValue(undefined);

    provider = new AssemblyAIProvider();
  });

  describe('name', () => {
    it('is assemblyai', () => {
      expect(provider.name).toBe('assemblyai');
    });
  });

  describe('isAvailable()', () => {
    it('returns true when AudioContext is present', () => {
      expect(provider.isAvailable()).toBe(true);
    });
  });

  describe('isConfigured()', () => {
    it('returns false when no API key in localStorage', () => {
      expect(provider.isConfigured()).toBe(false);
    });

    it('returns true when API key is set', () => {
      localStorage.setItem('speak-doc:assemblyai-api-key', 'my-key');
      expect(provider.isConfigured()).toBe(true);
    });

    it('returns false when key is only whitespace', () => {
      localStorage.setItem('speak-doc:assemblyai-api-key', '   ');
      expect(provider.isConfigured()).toBe(false);
    });
  });

  describe('start()', () => {
    it('calls errorCallback if no API key configured', async () => {
      const onError = vi.fn();
      provider.onError(onError);

      provider.start('en');
      await vi.waitFor(() =>
        expect(onError).toHaveBeenCalledWith(
          'AssemblyAI API key not set. Please configure it in Settings.',
        ),
      );
    });

    it('connects to streaming transcriber', async () => {
      localStorage.setItem('speak-doc:assemblyai-api-key', 'test-key');
      provider.start('en');

      await vi.waitFor(() => expect(mockTranscriber.connect).toHaveBeenCalled());
    });

    it('uses English speech model for English language', async () => {
      localStorage.setItem('speak-doc:assemblyai-api-key', 'test-key');
      provider.start('en');

      await vi.waitFor(() => expect(mockTranscriber.connect).toHaveBeenCalled());
      expect(mockStreamingTranscriber).toHaveBeenCalledWith(
        expect.objectContaining({ speechModel: 'universal-streaming-english' }),
      );
    });

    it('uses multilingual model for Italian', async () => {
      localStorage.setItem('speak-doc:assemblyai-api-key', 'test-key');
      provider.start('it');

      await vi.waitFor(() => expect(mockTranscriber.connect).toHaveBeenCalled());
      expect(mockStreamingTranscriber).toHaveBeenCalledWith(
        expect.objectContaining({ speechModel: 'universal-streaming-multilingual' }),
      );
    });

    it('requests microphone after connecting', async () => {
      localStorage.setItem('speak-doc:assemblyai-api-key', 'test-key');
      provider.start('en');

      await vi.waitFor(() => expect(mockGetUserMedia).toHaveBeenCalledWith({ audio: true }));
    });

    it('loads the AudioWorklet module', async () => {
      localStorage.setItem('speak-doc:assemblyai-api-key', 'test-key');
      provider.start('en');

      await vi.waitFor(() =>
        expect(mockAudioWorklet.addModule).toHaveBeenCalledWith('/pcm-processor.worklet.js'),
      );
    });

    it('calls errorCallback and endCallback when mic access denied', async () => {
      localStorage.setItem('speak-doc:assemblyai-api-key', 'test-key');
      mockGetUserMedia.mockRejectedValueOnce(new Error('Permission denied'));

      const onError = vi.fn();
      const onEnd = vi.fn();
      provider.onError(onError);
      provider.onEnd(onEnd);

      provider.start('en');
      await vi.waitFor(() => expect(onError).toHaveBeenCalledWith('Permission denied'));
      expect(onEnd).toHaveBeenCalled();
    });
  });

  describe('audio streaming', () => {
    it('calls transcriber.sendAudio when worklet posts PCM data', async () => {
      localStorage.setItem('speak-doc:assemblyai-api-key', 'test-key');
      provider.start('en');

      await vi.waitFor(() =>
        expect(mockAudioWorklet.addModule).toHaveBeenCalledWith('/pcm-processor.worklet.js'),
      );

      const buffer = new ArrayBuffer(256);
      mockWorkletPort.onmessage?.({ data: buffer } as MessageEvent<ArrayBuffer>);

      expect(mockTranscriber.sendAudio).toHaveBeenCalledWith(buffer);
    });

    it('does not forward audio after abort', async () => {
      localStorage.setItem('speak-doc:assemblyai-api-key', 'test-key');
      provider.start('en');

      await vi.waitFor(() =>
        expect(mockAudioWorklet.addModule).toHaveBeenCalledWith('/pcm-processor.worklet.js'),
      );

      provider.abort();

      const buffer = new ArrayBuffer(256);
      mockWorkletPort.onmessage?.({ data: buffer } as MessageEvent<ArrayBuffer>);

      expect(mockTranscriber.sendAudio).not.toHaveBeenCalled();
    });
  });

  describe('turn events', () => {
    it('emits interim result when end_of_turn is false', async () => {
      localStorage.setItem('speak-doc:assemblyai-api-key', 'test-key');
      const onResult = vi.fn();
      provider.onResult(onResult);

      provider.start('en');
      await vi.waitFor(() => expect(mockTranscriber.connect).toHaveBeenCalled());

      const listeners = getTranscriberListeners();
      listeners['turn']?.({ transcript: 'Hello', end_of_turn: false });

      expect(onResult).toHaveBeenCalledWith({ transcript: 'Hello', isFinal: false });
    });

    it('emits final result when end_of_turn is true', async () => {
      localStorage.setItem('speak-doc:assemblyai-api-key', 'test-key');
      const onResult = vi.fn();
      provider.onResult(onResult);

      provider.start('en');
      await vi.waitFor(() => expect(mockTranscriber.connect).toHaveBeenCalled());

      const listeners = getTranscriberListeners();
      listeners['turn']?.({ transcript: 'Hello world', end_of_turn: true });

      expect(onResult).toHaveBeenCalledWith({ transcript: 'Hello world', isFinal: true });
    });

    it('does not emit result for empty transcript', async () => {
      localStorage.setItem('speak-doc:assemblyai-api-key', 'test-key');
      const onResult = vi.fn();
      provider.onResult(onResult);

      provider.start('en');
      await vi.waitFor(() => expect(mockTranscriber.connect).toHaveBeenCalled());

      const listeners = getTranscriberListeners();
      listeners['turn']?.({ transcript: '', end_of_turn: false });

      expect(onResult).not.toHaveBeenCalled();
    });
  });

  describe('error events', () => {
    it('calls errorCallback on streaming error', async () => {
      localStorage.setItem('speak-doc:assemblyai-api-key', 'test-key');
      const onError = vi.fn();
      provider.onError(onError);

      provider.start('en');
      await vi.waitFor(() => expect(mockTranscriber.connect).toHaveBeenCalled());

      const listeners = getTranscriberListeners();
      listeners['error']?.(new Error('WebSocket error'));

      expect(onError).toHaveBeenCalledWith('WebSocket error');
    });
  });

  describe('stop()', () => {
    it('closes transcriber and calls endCallback via close event', async () => {
      localStorage.setItem('speak-doc:assemblyai-api-key', 'test-key');
      const onEnd = vi.fn();
      provider.onEnd(onEnd);

      provider.start('en');
      await vi.waitFor(() => expect(mockTranscriber.connect).toHaveBeenCalled());

      provider.stop();
      expect(mockTranscriber.close).toHaveBeenCalled();

      const listeners = getTranscriberListeners();
      listeners['close']?.();

      expect(onEnd).toHaveBeenCalled();
    });
  });

  describe('abort()', () => {
    it('cleans up without calling endCallback or emitting results', async () => {
      localStorage.setItem('speak-doc:assemblyai-api-key', 'test-key');
      const onEnd = vi.fn();
      const onResult = vi.fn();
      provider.onEnd(onEnd);
      provider.onResult(onResult);

      provider.start('en');
      await vi.waitFor(() => expect(mockTranscriber.connect).toHaveBeenCalled());

      provider.abort();

      const listeners = getTranscriberListeners();
      listeners['turn']?.({ transcript: 'Hello', end_of_turn: true });

      expect(onResult).not.toHaveBeenCalled();
      expect(onEnd).not.toHaveBeenCalled();
    });
  });
});
