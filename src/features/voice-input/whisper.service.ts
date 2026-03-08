import WhisperWorkerClass from './whisper.worker.ts?worker';
import { WHISPER_MODELS, type WhisperModelSize } from '@/constants/whisper-config';

type WorkerFactory = () => Worker;

export class WhisperService {
  private worker: Worker | null = null;
  private loadedSize: WhisperModelSize | null = null;
  private transcriptionCounter = 0;
  private readonly workerFactory: WorkerFactory;

  constructor(workerFactory?: WorkerFactory) {
    this.workerFactory = workerFactory ?? (() => new WhisperWorkerClass());
  }

  private getWorker(): Worker {
    if (!this.worker) {
      this.worker = this.workerFactory();
    }
    return this.worker;
  }

  isLoaded(): boolean {
    return this.loadedSize !== null;
  }

  getLoadedModelSize(): WhisperModelSize | null {
    return this.loadedSize;
  }

  async load(size: WhisperModelSize, onProgress?: (pct: number) => void): Promise<void> {
    if (this.loadedSize === size) return;

    this.loadedSize = null;
    const { modelId } = WHISPER_MODELS[size];
    const worker = this.getWorker();

    return new Promise<void>((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        const { type, payload } = event.data as { type: string; payload: unknown };

        if (type === 'load:progress') {
          onProgress?.(payload as number);
        } else if (type === 'load:done') {
          worker.removeEventListener('message', handler);
          this.loadedSize = size;
          resolve();
        } else if (type === 'load:error') {
          worker.removeEventListener('message', handler);
          reject(new Error(payload as string));
        }
      };

      worker.addEventListener('message', handler);
      worker.postMessage({ type: 'load', payload: { size, modelId } });
    });
  }

  async transcribe(audioBlob: Blob, onChunk?: (text: string) => void, language?: string): Promise<string> {
    if (!this.loadedSize) throw new Error('WhisperService: not loaded');

    // Decode compressed audio (mp3, m4a, webm, wav…) and resample to 16 kHz PCM.
    // Whisper is trained on 16 kHz audio — passing a wrong sample rate causes
    // garbled / repeated output (the "SSSS…" pattern).
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    audioContext.close();

    const targetSampleRate = 16000;
    const offlineCtx = new OfflineAudioContext(
      1,
      Math.ceil(audioBuffer.duration * targetSampleRate),
      targetSampleRate,
    );
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);
    const resampled = await offlineCtx.startRendering();
    const float32 = resampled.getChannelData(0);

    // Transfer the buffer to the worker (zero-copy)
    const id = ++this.transcriptionCounter;
    const transferBuffer = float32.buffer.slice(0) as ArrayBuffer;
    const worker = this.getWorker();

    return new Promise<string>((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        const msg = event.data as { type: string; id: number; payload: unknown };
        if (msg.id !== id) return;

        if (msg.type === 'transcribe:chunk') {
          onChunk?.(msg.payload as string);
        } else if (msg.type === 'transcribe:done') {
          worker.removeEventListener('message', handler);
          resolve(msg.payload as string);
        } else if (msg.type === 'transcribe:error') {
          worker.removeEventListener('message', handler);
          reject(new Error(msg.payload as string));
        }
      };

      worker.addEventListener('message', handler);
      worker.postMessage(
        { type: 'transcribe', payload: { id, buffer: transferBuffer, language } },
        [transferBuffer],
      );
    });
  }

  unload(): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'unload' });
    }
    this.loadedSize = null;
  }
}
