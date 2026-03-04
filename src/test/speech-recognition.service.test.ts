import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SpeechRecognitionService } from '@/features/voice-input/speech-recognition.service';
import type { TranscriptionResult } from '@/types/voice';

// Minimal SpeechRecognition mock
class MockSpeechRecognition {
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;

  onresult: ((e: SpeechRecognitionEvent) => void) | null = null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null = null;
  onend: (() => void) | null = null;

  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
}

let mockInstance: MockSpeechRecognition;

class MockSpeechRecognitionCtor {
  lang = '';
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onresult: ((e: SpeechRecognitionEvent) => void) | null = null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    mockInstance = this as unknown as MockSpeechRecognition;
  }
}

vi.stubGlobal('SpeechRecognition', MockSpeechRecognitionCtor);

const makeResultEvent = (
  transcript: string,
  isFinal: boolean,
  confidence = 1.0,
): SpeechRecognitionEvent => ({
  resultIndex: 0,
  results: {
    0: {
      isFinal,
      0: { transcript, confidence },
      length: 1,
    } as unknown as SpeechRecognitionResult,
    length: 1,
    item: () => null as unknown as SpeechRecognitionResult,
  } as unknown as SpeechRecognitionResultList,
} as unknown as SpeechRecognitionEvent);

describe('SpeechRecognitionService', () => {
  let onResult: (result: TranscriptionResult) => void;
  let onError: (error: string) => void;
  let onEnd: () => void;
  let service: SpeechRecognitionService;

  beforeEach(() => {
    onResult = vi.fn();
    onError = vi.fn();
    onEnd = vi.fn();
    service = new SpeechRecognitionService(onResult, onError, onEnd);
  });

  it('sets lang, continuous, interimResults and maxAlternatives on start', () => {
    service.start('it');
    expect(mockInstance.lang).toBe('it-IT');
    expect(mockInstance.continuous).toBe(true);
    expect(mockInstance.interimResults).toBe(true);
    expect(mockInstance.maxAlternatives).toBe(3);
    expect(mockInstance.start).toHaveBeenCalledTimes(1);
  });

  it('forwards final result to onResult callback', () => {
    service.start('it');
    mockInstance.onresult!(makeResultEvent('ciao mondo', true));
    expect(onResult).toHaveBeenCalledWith({ transcript: 'ciao mondo', isFinal: true });
  });

  it('forwards interim result to onResult callback', () => {
    service.start('it');
    mockInstance.onresult!(makeResultEvent('ciao', false));
    expect(onResult).toHaveBeenCalledWith({ transcript: 'ciao', isFinal: false });
  });

  it('auto-restarts when onend fires during active recording (silence gap)', () => {
    service.start('it');
    const firstInstance = mockInstance;
    expect(firstInstance.start).toHaveBeenCalledTimes(1);

    // Simulate browser stopping due to silence — onend fires without explicit stop()
    firstInstance.onend!();

    // A new instance was created and started
    expect(mockInstance).not.toBe(firstInstance);
    expect(mockInstance.start).toHaveBeenCalledTimes(1);
    // The user's onEnd callback must NOT have been called
    expect(onEnd).not.toHaveBeenCalled();
  });

  it('does NOT auto-restart after explicit stop()', () => {
    service.start('it');
    service.stop();
    mockInstance.onend!();

    expect(mockInstance.start).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('does NOT auto-restart after abort()', () => {
    service.start('it');
    service.abort();
    mockInstance.onend!();

    expect(mockInstance.start).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('picks the highest-confidence alternative', () => {
    service.start('it');

    const event: SpeechRecognitionEvent = {
      resultIndex: 0,
      results: {
        0: {
          isFinal: true,
          0: { transcript: 'basso', confidence: 0.4 },
          1: { transcript: 'alto', confidence: 0.9 },
          2: { transcript: 'medio', confidence: 0.6 },
          length: 3,
        } as unknown as SpeechRecognitionResult,
        length: 1,
        item: () => null as unknown as SpeechRecognitionResult,
      } as unknown as SpeechRecognitionResultList,
    } as unknown as SpeechRecognitionEvent;

    mockInstance.onresult!(event);
    expect(onResult).toHaveBeenCalledWith({ transcript: 'alto', isFinal: true });
  });

  it('forwards error to onError callback', () => {
    service.start('it');
    mockInstance.onerror!({ error: 'network' } as SpeechRecognitionErrorEvent);
    expect(onError).toHaveBeenCalledWith('network');
  });

  it('errors when Web Speech API is unavailable', () => {
    vi.stubGlobal('SpeechRecognition', undefined);
    vi.stubGlobal('webkitSpeechRecognition', undefined);
    service.start('it');
    expect(onError).toHaveBeenCalledWith(expect.stringContaining('not supported'));
    // restore
    vi.stubGlobal('SpeechRecognition', vi.fn(() => {
      mockInstance = new MockSpeechRecognition();
      return mockInstance;
    }));
  });
});
