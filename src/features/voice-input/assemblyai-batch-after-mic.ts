import { STORAGE_KEYS } from '@/constants/config';
import { loadAssemblyAiModelFromStorage } from '@/constants/assemblyai-config';
import type { LanguageCode } from '@/types/language';
import type { AssemblyAIService } from './assemblyai.service';

export type AssemblyAiBatchPrecheck =
  | { ok: true; blob: Blob; apiKey: string }
  | { ok: false; message: string };

/** Validates blob + API key before starting batch transcription. */
export function assemblyAiBatchPrecheck(blob: Blob | null): AssemblyAiBatchPrecheck {
  if (!blob || blob.size === 0) {
    return { ok: false, message: 'No audio captured. Try recording again.' };
  }
  const apiKey = localStorage.getItem(STORAGE_KEYS.ASSEMBLYAI_API_KEY)?.trim();
  if (!apiKey) {
    return { ok: false, message: 'AssemblyAI API key not set. Configure it in Settings.' };
  }
  return { ok: true, blob, apiKey };
}

/** Runs batch transcribe after precheck succeeded. */
export async function transcribeMicBlobWithAssemblyAi(
  blob: Blob,
  apiKey: string,
  speakingLanguage: LanguageCode,
  service: AssemblyAIService,
): Promise<string> {
  service.configure(apiKey);
  const model = loadAssemblyAiModelFromStorage();
  return service.transcribe(blob, speakingLanguage, model);
}
