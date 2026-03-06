/// <reference lib="webworker" />
import { pipeline, env } from '@xenova/transformers';
import type { WhisperModelSize } from '@/constants/whisper-config';

// Disable local model lookup — always fetch from Hugging Face Hub
env.allowLocalModels = false;

type TranscriberPipeline = (
  audio: Float32Array,
  opts?: Record<string, unknown>,
) => Promise<{ text: string }>;

let pipe: TranscriberPipeline | null = null;
let loadedSize: WhisperModelSize | null = null;

self.addEventListener('message', async (event: MessageEvent) => {
  const { type, payload } = event.data as { type: string; payload: Record<string, unknown> };

  if (type === 'load') {
    const { size, modelId } = payload as { size: WhisperModelSize; modelId: string };

    if (pipe !== null && loadedSize === size) {
      self.postMessage({ type: 'load:done' });
      return;
    }

    pipe = null;
    loadedSize = null;

    try {
      const loaded = await pipeline('automatic-speech-recognition', modelId, {
        progress_callback: (e: { status?: string; progress?: number }) => {
          console.log(e);
          if (e.status === 'progress' && typeof e.progress === 'number' && !isNaN(e.progress)) {
            self.postMessage({ type: 'load:progress', payload: e.progress });
          }
        },
      });

      pipe = loaded as unknown as TranscriberPipeline;
      loadedSize = size;
      self.postMessage({ type: 'load:done' });
    } catch (err) {
      self.postMessage({
        type: 'load:error',
        payload: err instanceof Error ? err.message : 'Load failed',
      });
    }
  } else if (type === 'transcribe') {
    const { id, buffer } = payload as { id: number; buffer: ArrayBuffer };

    if (!pipe) {
      self.postMessage({ type: 'transcribe:error', id, payload: 'WhisperService: not loaded' });
      return;
    }

    try {
      const float32 = new Float32Array(buffer);
      const result = await pipe(float32, {
        sampling_rate: 16000,
        chunk_length_s: 30,
        stride_length_s: 5,
        chunk_callback: (chunk: { text: string }) => {
          console.log('Chunk callback:', chunk);
          const text = chunk.text?.trim();
          if (text) self.postMessage({ type: 'transcribe:chunk', id, payload: text });
        },
      });
      self.postMessage({ type: 'transcribe:done', id, payload: result.text.trim() });
    } catch (err) {
      console.log(err);
      self.postMessage({
        type: 'transcribe:error',
        id,
        payload: err instanceof Error ? err.message : 'Transcription failed',
      });
    }
  } else if (type === 'unload') {
    pipe = null;
    loadedSize = null;
  }
});
