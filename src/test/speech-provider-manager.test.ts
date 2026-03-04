import { describe, it, expect, vi } from 'vitest';
import { SpeechProviderManager } from '@/features/voice-input/SpeechProviderManager';
import type { SpeechCallbacks } from '@/features/voice-input/SpeechProviderManager';
import type { ISpeechProvider, SpeechProviderName } from '@/features/voice-input/types/speech-provider';
import type { LanguageCode } from '@/types/language';

const makeProvider = (
  name: SpeechProviderName,
  available = true,
  configured = true,
): ISpeechProvider & {
  startMock: ReturnType<typeof vi.fn>;
  stopMock: ReturnType<typeof vi.fn>;
  abortMock: ReturnType<typeof vi.fn>;
} => {
  const startMock = vi.fn();
  const stopMock = vi.fn();
  const abortMock = vi.fn();
  return {
    name,
    isAvailable: vi.fn(() => available),
    isConfigured: vi.fn(() => configured),
    onResult: vi.fn(),
    onError: vi.fn(),
    onEnd: vi.fn(),
    startMock,
    stopMock,
    abortMock,
    start(language: LanguageCode) {
      startMock(language);
    },
    stop() {
      stopMock();
    },
    abort() {
      abortMock();
    },
  };
};

const noopCallbacks: SpeechCallbacks = {
  onResult: vi.fn(),
  onError: vi.fn(),
  onEnd: vi.fn(),
};

describe('SpeechProviderManager', () => {
  describe('selectBestProvider', () => {
    it('returns first available + configured provider', () => {
      const webSpeech = makeProvider('web-speech');
      const manager = new SpeechProviderManager([webSpeech]);

      const selected = manager.selectBestProvider();

      expect(selected).toBe(webSpeech);
    });

    it('skips unavailable providers in fallback chain', () => {
      const unavailable = makeProvider('whisper', false, false);
      const fallback = makeProvider('web-speech');
      const manager = new SpeechProviderManager([unavailable, fallback]);

      const selected = manager.selectBestProvider();

      expect(selected).toBe(fallback);
    });

    it('returns preferred provider when available', () => {
      const webSpeech = makeProvider('web-speech');
      const whisper = makeProvider('whisper');
      const manager = new SpeechProviderManager([webSpeech, whisper]);

      const selected = manager.selectBestProvider('whisper');

      expect(selected).toBe(whisper);
    });

    it('falls back to next available when preferred is unavailable', () => {
      const webSpeech = makeProvider('web-speech');
      const unavailableWhisper = makeProvider('whisper', false);
      const manager = new SpeechProviderManager([webSpeech, unavailableWhisper]);

      const selected = manager.selectBestProvider('whisper');

      expect(selected).toBe(webSpeech);
    });

    it('throws when no provider is available', () => {
      const manager = new SpeechProviderManager([makeProvider('web-speech', false)]);

      expect(() => manager.selectBestProvider()).toThrow('No speech provider available');
    });
  });

  describe('start', () => {
    it('registers callbacks and calls start on selected provider', () => {
      const provider = makeProvider('web-speech');
      const manager = new SpeechProviderManager([provider]);
      const callbacks: SpeechCallbacks = {
        onResult: vi.fn(),
        onError: vi.fn(),
        onEnd: vi.fn(),
      };

      manager.start('it', callbacks);

      expect(provider.onResult).toHaveBeenCalledWith(callbacks.onResult);
      expect(provider.onError).toHaveBeenCalledWith(callbacks.onError);
      expect(provider.onEnd).toHaveBeenCalledWith(callbacks.onEnd);
      expect(provider.startMock).toHaveBeenCalledWith('it');
    });
  });

  describe('stop', () => {
    it('calls stop on the active provider', () => {
      const provider = makeProvider('web-speech');
      const manager = new SpeechProviderManager([provider]);

      manager.start('en', noopCallbacks);
      manager.stop();

      expect(provider.stopMock).toHaveBeenCalled();
    });

    it('is a no-op when nothing is active', () => {
      const manager = new SpeechProviderManager([makeProvider('web-speech')]);
      expect(() => manager.stop()).not.toThrow();
    });
  });

  describe('abort', () => {
    it('calls abort on the active provider', () => {
      const provider = makeProvider('web-speech');
      const manager = new SpeechProviderManager([provider]);

      manager.start('en', noopCallbacks);
      manager.abort();

      expect(provider.abortMock).toHaveBeenCalled();
    });

    it('is a no-op when nothing is active', () => {
      const manager = new SpeechProviderManager([makeProvider('web-speech')]);
      expect(() => manager.abort()).not.toThrow();
    });
  });
});
