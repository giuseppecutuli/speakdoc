import type { LanguageCode } from '@/types/language';
import type { ISpeechProvider, SpeechProviderName } from '../types/speech-provider';
import type { TranscriptionResult } from '@/types/voice';
import { WhisperService } from '../whisper.service';
import { DEFAULT_WHISPER_MODEL_SIZE, WHISPER_CHUNK_INTERVAL_MS, type WhisperModelSize } from '@/constants/whisper-config';

export class WhisperProvider implements ISpeechProvider {
  readonly name: SpeechProviderName = 'whisper';

  private service: WhisperService;
  private modelSize: WhisperModelSize = DEFAULT_WHISPER_MODEL_SIZE;
  private resultCallback: ((result: TranscriptionResult) => void) | null = null;
  private errorCallback: ((error: string) => void) | null = null;
  private endCallback: (() => void) | null = null;

  private language: LanguageCode | null = null;
  private stream: MediaStream | null = null;
  private currentRecorder: MediaRecorder | null = null;
  private chunkTimer: ReturnType<typeof setInterval> | null = null;
  private transcriptionQueue: Promise<void> = Promise.resolve();
  private pendingTranscriptions = 0;
  private isStopped = false;
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

  async start(language: LanguageCode): Promise<void> {
    this.language = language;
    this.aborted = false;
    this.isStopped = false;
    this.pendingTranscriptions = 0;
    this.transcriptionQueue = Promise.resolve();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.stream = stream;

    this.createRecorder(stream);

    this.chunkTimer = setInterval(() => {
      if (!this.aborted && !this.isStopped && this.stream) {
        this.rotateRecorder();
      }
    }, WHISPER_CHUNK_INTERVAL_MS);
  }

  private createRecorder(stream: MediaStream): void {
    const rec = new MediaRecorder(stream);
    this.currentRecorder = rec;
    const chunks: Blob[] = [];

    rec.ondataavailable = (e: { data: Blob }) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    rec.onstop = async () => {
      if (this.aborted) return;

      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      this.pendingTranscriptions++;

      this.transcriptionQueue = this.transcriptionQueue.then(async () => {
        try {
          const transcript = await this.service.transcribe(audioBlob, undefined, this.language ?? undefined);
          this.resultCallback?.({ transcript, isFinal: true });
        } catch (err) {
          this.errorCallback?.(err instanceof Error ? err.message : String(err));
        } finally {
          this.pendingTranscriptions--;
          this.checkAllDone();
        }
      });

      // Await so callers (including tests) can know when transcription completes
      await this.transcriptionQueue;
    };

    rec.start();
  }

  private rotateRecorder(): void {
    const old = this.currentRecorder;
    if (old) old.stop();
    if (this.stream) this.createRecorder(this.stream);
  }

  private checkAllDone(): void {
    if (this.isStopped && this.pendingTranscriptions === 0 && !this.aborted) {
      this.stream?.getTracks().forEach((t) => t.stop());
      this.stream = null;
      this.endCallback?.();
    }
  }

  stop(): void {
    this.clearTimer();
    this.isStopped = true;
    this.currentRecorder?.stop();
    this.currentRecorder = null;
  }

  abort(): void {
    this.aborted = true;
    this.clearTimer();
    this.currentRecorder?.stop();
    this.currentRecorder = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  private clearTimer(): void {
    if (this.chunkTimer !== null) {
      clearInterval(this.chunkTimer);
      this.chunkTimer = null;
    }
  }
}
