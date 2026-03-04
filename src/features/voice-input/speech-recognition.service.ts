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

const getBestAlternative = (result: SpeechRecognitionResult): string => {
  let best = result[0];
  for (let i = 1; i < result.length; i++) {
    if (result[i].confidence > best.confidence) best = result[i];
  }
  return best.transcript;
};

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null;
  private intentionallyStopped = false;
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

    this.intentionallyStopped = false;
    this._createAndStart(Ctor, language);
  }

  private _createAndStart(Ctor: new () => SpeechRecognition, language: LanguageCode): void {
    const rec = new Ctor();
    rec.lang = SUPPORTED_LANGUAGES[language].speechCode;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        this.onResult({ transcript: getBestAlternative(result), isFinal: result.isFinal });
      }
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.onError(event.error);
    };

    rec.onend = () => {
      if (!this.intentionallyStopped) {
        // Silence-triggered stop — restart seamlessly to avoid losing words
        this._createAndStart(Ctor, language);
        return;
      }
      this.onEnd();
    };

    this.recognition = rec;
    rec.start();
  }

  stop(): void {
    this.intentionallyStopped = true;
    this.recognition?.stop();
    this.recognition = null;
  }

  abort(): void {
    this.intentionallyStopped = true;
    this.recognition?.abort();
    this.recognition = null;
  }
}
