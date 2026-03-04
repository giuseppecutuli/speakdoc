import type { LanguageCode } from '@/types/language';
import type { TranscriptionResult } from '@/types/voice';
import type { ISpeechProvider, SpeechProviderName } from './types/speech-provider';
import { WebSpeechProvider } from './providers/WebSpeechProvider';

export interface SpeechCallbacks {
  onResult: (result: TranscriptionResult) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

const DEFAULT_PROVIDERS = (): ISpeechProvider[] => [new WebSpeechProvider()];

export class SpeechProviderManager {
  private readonly providers: ISpeechProvider[];
  private activeProvider: ISpeechProvider | null = null;

  constructor(providers: ISpeechProvider[] = DEFAULT_PROVIDERS()) {
    this.providers = providers;
  }

  selectBestProvider(preferredName?: SpeechProviderName): ISpeechProvider {
    if (preferredName) {
      const preferred = this.providers.find((p) => p.name === preferredName);
      if (preferred?.isAvailable() && preferred.isConfigured()) {
        return preferred;
      }
    }

    const available = this.providers.find((p) => p.isAvailable() && p.isConfigured());
    if (!available) {
      throw new Error('No speech provider available. Please check your browser settings.');
    }
    return available;
  }

  start(language: LanguageCode, callbacks: SpeechCallbacks, preferredName?: SpeechProviderName): void {
    const provider = this.selectBestProvider(preferredName);
    provider.onResult(callbacks.onResult);
    provider.onError(callbacks.onError);
    provider.onEnd(callbacks.onEnd);
    provider.start(language);
    this.activeProvider = provider;
  }

  stop(): void {
    this.activeProvider?.stop();
    this.activeProvider = null;
  }

  abort(): void {
    this.activeProvider?.abort();
    this.activeProvider = null;
  }
}
