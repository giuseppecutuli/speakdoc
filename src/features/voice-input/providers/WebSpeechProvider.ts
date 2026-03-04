import type { LanguageCode } from '@/types/language';
import type { TranscriptionResult } from '@/types/voice';
import type { ISpeechProvider, SpeechProviderName } from '../types/speech-provider';
import { SpeechRecognitionService } from '../speech-recognition.service';

export class WebSpeechProvider implements ISpeechProvider {
  readonly name: SpeechProviderName = 'web-speech';

  private service: SpeechRecognitionService | null = null;
  private resultCallback: ((result: TranscriptionResult) => void) | null = null;
  private errorCallback: ((error: string) => void) | null = null;
  private endCallback: (() => void) | null = null;

  isAvailable(): boolean {
    return !!(
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    );
  }

  isConfigured(): boolean {
    return this.isAvailable();
  }

  onResult(callback: (result: TranscriptionResult) => void): void {
    this.resultCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    this.errorCallback = callback;
  }

  onEnd(callback: () => void): void {
    this.endCallback = callback;
  }

  start(language: LanguageCode): void {
    this.service = new SpeechRecognitionService(
      (result) => this.resultCallback?.(result),
      (error) => this.errorCallback?.(error),
      () => this.endCallback?.(),
    );
    this.service.start(language);
  }

  stop(): void {
    this.service?.stop();
    this.service = null;
  }

  abort(): void {
    this.service?.abort();
    this.service = null;
  }
}
