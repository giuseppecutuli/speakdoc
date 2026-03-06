export type WhisperModelSize = 'tiny' | 'base' | 'small';

export interface WhisperModelMeta {
  modelId: string;
  label: string;
  approxSize: string;
}

export const WHISPER_MODELS: Record<WhisperModelSize, WhisperModelMeta> = {
  tiny: { modelId: 'Xenova/whisper-tiny', label: 'Tiny (~75 MB)', approxSize: '75 MB' },
  base: { modelId: 'Xenova/whisper-base', label: 'Base (~140 MB)', approxSize: '140 MB' },
  small: { modelId: 'Xenova/whisper-small', label: 'Small (~430 MB)', approxSize: '430 MB' },
};

export const DEFAULT_WHISPER_MODEL_SIZE: WhisperModelSize = 'tiny';
export const WHISPER_LOAD_TIMEOUT_MS = 60_000;
// Interval at which Whisper rotates its MediaRecorder — keeps each chunk ≤30s
// so the model works within its optimal input range (trained on ≤30s segments)
export const WHISPER_CHUNK_INTERVAL_MS = 30_000;
