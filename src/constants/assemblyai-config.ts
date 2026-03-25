import type { LanguageCode } from '@/types/language';
import type { StreamingSpeechModel } from 'assemblyai';

export type AssemblyAIModel = 'universal-2' | 'universal-3-pro';

/** Language code used by the batch transcription API */
export const ASSEMBLYAI_LANGUAGE_MAP: Record<LanguageCode, string> = {
  en: 'en_us',
  it: 'it',
};

/** Speech model used by the real-time streaming API, per speaking language */
export const ASSEMBLYAI_STREAMING_MODEL_MAP: Record<LanguageCode, StreamingSpeechModel> = {
  en: 'universal-streaming-english',
  it: 'universal-streaming-multilingual',
};

export const ASSEMBLYAI_MODELS: readonly AssemblyAIModel[] = ['universal-2', 'universal-3-pro'] as const;

export const DEFAULT_ASSEMBLYAI_MODEL: AssemblyAIModel = 'universal-2';
