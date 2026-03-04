import type { LanguageCode } from '@/types/language';
import type { TranscriptionResult } from '@/types/voice';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';

type OnResultCallback = (result: TranscriptionResult) => void;
type OnErrorCallback = (error: string) => void;
type OnEndCallback = () => void;

const getSpeechRecognitionConstructor = (): (new () => SpeechRecognition) | null => {
  if (window.SpeechRecognition) return window.SpeechRecognition;
  if (window.webkitSpeechRecognition) return window.webkitSpeechRecognition;
  return null;
};

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private onResult: OnResultCallback;
  private onError: OnErrorCallback;
  private onEnd: OnEndCallback;

  constructor(
    onResult: OnResultCallback,
    onError: OnErrorCallback,
    onEnd: OnEndCallback,
  ) {
    this.onResult = onResult;
    this.onError = onError;
    this.onEnd = onEnd;
  }

  start(language: LanguageCode): void {
    const Ctor = getSpeechRecognitionConstructor();
    if (!Ctor) {
      this.onError('Web Speech API is not supported in this browser.');
      return;
    }

    this.recognition = new Ctor();
    this.recognition.lang = SUPPORTED_LANGUAGES[language].speechCode;
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        this.onResult({ transcript, isFinal: result.isFinal });
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.onError(event.error);
    };

    this.recognition.onend = () => {
      this.onEnd();
    };

    this.recognition.start();
  }

  stop(): void {
    this.recognition?.stop();
    this.recognition = null;
  }

  abort(): void {
    this.recognition?.abort();
    this.recognition = null;
  }
}
