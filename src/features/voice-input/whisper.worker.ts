/// <reference lib="webworker" />
import {
  pipeline,
  env,
  TextStreamer,
  type AutomaticSpeechRecognitionPipeline,
  type ProgressCallback,
} from '@huggingface/transformers';
import type { WhisperModelSize } from '@/constants/whisper-config';

// Always fetch from Hugging Face Hub, never from local paths
env.allowLocalModels = false;

let pipe: AutomaticSpeechRecognitionPipeline | null = null;
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
      const onProgress: ProgressCallback = (e) => {
        if (e.status === 'progress') {
          self.postMessage({ type: 'load:progress', payload: e.progress });
        }
      };
      // @ts-ignore
      pipe = await pipeline('automatic-speech-recognition', modelId, {
        progress_callback: onProgress,
      });

      loadedSize = size;
      self.postMessage({ type: 'load:done' });
    } catch (err) {
      self.postMessage({
        type: 'load:error',
        payload: err instanceof Error ? err.message : 'Load failed',
      });
    }
  } else if (type === 'transcribe') {
    const { id, buffer, language } = payload as { id: number; buffer: ArrayBuffer; language?: string };

    if (!pipe) {
      self.postMessage({ type: 'transcribe:error', id, payload: 'WhisperService: not loaded' });
      return;
    }

    try {
      const float32 = new Float32Array(buffer);

      // Stream decoded tokens in real-time as Whisper processes each 30s audio window.
      // Chunks are UX-only — the final authoritative text comes from result.text which
      // handles stride overlap deduplication across windows correctly.
      const streamer = new TextStreamer(pipe.tokenizer, {
        skip_prompt: true,
        skip_special_tokens: true,
        callback_function: (text: string) => {
          const trimmed = text.trim();
          if (trimmed) self.postMessage({ type: 'transcribe:chunk', id, payload: trimmed });
        },
      });

      const result = await pipe(float32, {
        chunk_length_s: 30,
        stride_length_s: 5,
        language: language ?? 'en',
        streamer,
      });

      // result is always a single object when called with a Float32Array (not an array)
      const output = Array.isArray(result) ? result[0] : result;
      self.postMessage({ type: 'transcribe:done', id, payload: output.text.trim() });
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
