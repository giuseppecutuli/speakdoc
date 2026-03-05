import { pipeline, env } from '@xenova/transformers';
import { WHISPER_MODELS, type WhisperModelSize } from '@/constants/whisper-config';

// Disable local model lookup — always fetch from Hugging Face Hub
env.allowLocalModels = false;

type TranscriberPipeline = {
  __call(audio: Float32Array | ArrayBuffer, opts?: Record<string, unknown>): Promise<{ text: string }>;
};

export class WhisperService {
  private pipe: TranscriberPipeline | null = null;
  private loadedSize: WhisperModelSize | null = null;

  isLoaded(): boolean {
    return this.pipe !== null;
  }

  getLoadedModelSize(): WhisperModelSize | null {
    return this.loadedSize;
  }

  async load(
    size: WhisperModelSize,
    onProgress?: (pct: number) => void,
  ): Promise<void> {
    if (this.pipe !== null && this.loadedSize === size) return;

    this.pipe = null;
    this.loadedSize = null;

    const { modelId } = WHISPER_MODELS[size];

    const loaded = await pipeline('automatic-speech-recognition', modelId, {
      progress_callback: (event: { status?: string; progress?: number }) => {
        if (event.status === 'progress' && typeof event.progress === 'number' && !isNaN(event.progress)) {
          onProgress?.(event.progress);
        }
      },
    });

    this.pipe = loaded as unknown as TranscriberPipeline;
    this.loadedSize = size;
  }

  async transcribe(audioBlob: Blob): Promise<string> {
    if (!this.pipe) throw new Error('WhisperService: not loaded');

    const arrayBuffer = await audioBlob.arrayBuffer();
    const result = await this.pipe.__call(arrayBuffer);
    return result.text.trim();
  }

  unload(): void {
    this.pipe = null;
    this.loadedSize = null;
  }
}
