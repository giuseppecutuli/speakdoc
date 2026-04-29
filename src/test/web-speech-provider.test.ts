import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebSpeechProvider } from '@/features/voice-input/providers/WebSpeechProvider';
import type { TranscriptionResult } from '@/types/voice';

type ServiceInstance = {
  onResultCb: ((r: TranscriptionResult) => void) | null;
  onErrorCb: ((e: string) => void) | null;
  onEndCb: (() => void) | null;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  abort: ReturnType<typeof vi.fn>;
};

let lastInstance: ServiceInstance;

vi.mock('@/features/voice-input/speech-recognition.service', () => {
  return {
    SpeechRecognitionService: class MockSpeechRecognitionService {
      onResultCb: ((r: TranscriptionResult) => void) | null = null;
      onErrorCb: ((e: string) => void) | null = null;
      onEndCb: (() => void) | null = null;
      start = vi.fn();
      stop = vi.fn();
      abort = vi.fn();

      constructor(
        onResult: (r: TranscriptionResult) => void,
        onError: (e: string) => void,
        onEnd: () => void,
      ) {
        this.onResultCb = onResult;
        this.onErrorCb = onError;
        this.onEndCb = onEnd;
        lastInstance = this as unknown as ServiceInstance;
      }
    },
  };
});

vi.stubGlobal('SpeechRecognition', class {});

describe('WebSpeechProvider', () => {
  let provider: WebSpeechProvider;

  beforeEach(() => {
    provider = new WebSpeechProvider();
  });

  it('has name "web-speech"', () => {
    expect(provider.name).toBe('web-speech');
  });

  it('isAvailable() returns true when SpeechRecognition is present', () => {
    expect(provider.isAvailable()).toBe(true);
  });

  it('isAvailable() returns false when neither API is present', () => {
    vi.stubGlobal('SpeechRecognition', undefined);
    vi.stubGlobal('webkitSpeechRecognition', undefined);

    const p = new WebSpeechProvider();
    expect(p.isAvailable()).toBe(false);

    vi.stubGlobal('SpeechRecognition', class {});
  });

  it('isConfigured() mirrors isAvailable()', () => {
    expect(provider.isConfigured()).toBe(provider.isAvailable());
  });

  it('start() delegates to SpeechRecognitionService with given language', () => {
    provider.onResult(vi.fn());
    provider.onError(vi.fn());
    provider.onEnd(vi.fn());

    provider.start('it');

    expect(lastInstance.start).toHaveBeenCalledWith('it');
  });

  it('forwards result callback invocation', () => {
    const onResult = vi.fn();
    provider.onResult(onResult);
    provider.onError(vi.fn());
    provider.onEnd(vi.fn());

    provider.start('en');
    lastInstance.onResultCb!({ transcript: 'hello', isFinal: true });

    expect(onResult).toHaveBeenCalledWith({ transcript: 'hello', isFinal: true });
  });

  it('forwards error callback invocation', () => {
    const onError = vi.fn();
    provider.onResult(vi.fn());
    provider.onError(onError);
    provider.onEnd(vi.fn());

    provider.start('en');
    lastInstance.onErrorCb!('network');

    expect(onError).toHaveBeenCalledWith('network');
  });

  it('forwards end callback invocation', () => {
    const onEnd = vi.fn();
    provider.onResult(vi.fn());
    provider.onError(vi.fn());
    provider.onEnd(onEnd);

    provider.start('en');
    lastInstance.onEndCb!();

    expect(onEnd).toHaveBeenCalled();
  });

  it('stop() delegates to the underlying service', () => {
    provider.onResult(vi.fn());
    provider.onError(vi.fn());
    provider.onEnd(vi.fn());

    provider.start('it');
    provider.stop();

    expect(lastInstance.stop).toHaveBeenCalled();
  });

  it('abort() delegates to the underlying service', () => {
    provider.onResult(vi.fn());
    provider.onError(vi.fn());
    provider.onEnd(vi.fn());

    provider.start('it');
    provider.abort();

    expect(lastInstance.abort).toHaveBeenCalled();
  });
});
