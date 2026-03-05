import type { LanguageCode } from '@/types/language';
import type { ISpeechProvider, SpeechProviderName } from '../types/speech-provider';
import type { TranscriptionResult } from '@/types/voice';
import { WhisperService } from '../whisper.service';
import { DEFAULT_WHISPER_MODEL_SIZE, type WhisperModelSize } from '@/constants/whisper-config';

export class WhisperProvider implements ISpeechProvider {
  readonly name: SpeechProviderName = 'whisper';

  private service: WhisperService;
  private modelSize: WhisperModelSize = DEFAULT_WHISPER_MODEL_SIZE;
  private resultCallback: ((result: TranscriptionResult) => void) | null = null;
  private errorCallback: ((error: string) => void) | null = null;
  private endCallback: (() => void) | null = null;
  private recorder: MediaRecorder | null = null;
  private aborted = false;

  constructor() {
    this.service = new WhisperService();
  }

  isAvailable(): boolean {
    return (
      typeof WebAssembly !== 'undefined' &&
      typeof MediaRecorder !== 'undefined'
    );
  }

  isConfigured(): boolean {
    return this.service.isLoaded();
  }

  setModelSize(size: WhisperModelSize): void {
    this.modelSize = size;
  }

  getModelSize(): WhisperModelSize {
    return this.modelSize;
  }

  async configure(onProgress?: (pct: number) => void): Promise<void> {
    await this.service.load(this.modelSize, onProgress);
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

  async start(_language: LanguageCode): Promise<void> {
    this.aborted = false;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];

    this.recorder.ondataavailable = (e: { data: Blob }) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    this.recorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      if (this.aborted) return;

      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      try {
        const transcript = await this.service.transcribe(audioBlob);
        this.resultCallback?.({ transcript, isFinal: true });
      } catch (err) {
        this.errorCallback?.(err instanceof Error ? err.message : String(err));
      } finally {
        this.endCallback?.();
      }
    };

    this.recorder.start();
  }

  stop(): void {
    this.recorder?.stop();
    this.recorder = null;
  }

  abort(): void {
    this.aborted = true;
    this.recorder?.stop();
    this.recorder = null;
  }
}
