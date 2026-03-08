import type { LanguageCode } from '@/types/language';
import type { TranscriptionResult } from '@/types/voice';

export type SpeechProviderName = 'web-speech' | 'assemblyai';

export interface ISpeechProvider {
  readonly name: SpeechProviderName;
  isAvailable(): boolean;
  isConfigured(): boolean;
  start(language: LanguageCode): void;
  stop(): void;
  abort(): void;
  onResult(callback: (result: TranscriptionResult) => void): void;
  onError(callback: (error: string) => void): void;
  onEnd(callback: () => void): void;
}
