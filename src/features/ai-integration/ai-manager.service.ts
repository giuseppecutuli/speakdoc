import type { LanguageCode } from '@/types/language';
import type { AIBackend } from '@/types/ai';
import { AINotConfiguredError } from '@/types/ai';
import { buildSystemPrompt, buildCompactPrompt } from '@/constants/prompts';
import { isGeminiNanoAvailable, generateWithGeminiNano } from './gemini-nano.service';
import { isExternalAPIConfigured, generateWithExternalAPI } from './external-api.service';

export const detectActiveBackend = async (): Promise<AIBackend> => {
  if (await isGeminiNanoAvailable()) return 'gemini-nano';
  if (isExternalAPIConfigured()) return 'external-api';
  return 'none';
};

export async function* generateDocumentation(
  transcription: string,
  speakingLanguage: LanguageCode,
  outputLanguage: LanguageCode,
): AsyncGenerator<{ chunk: string; backend: AIBackend }> {
  if (await isGeminiNanoAvailable()) {
    // Gemini Nano has a small context window (~1k–4k tokens).
    // Use the compact prompt to leave room for the transcription and output.
    const compactPrompt = buildCompactPrompt(speakingLanguage, outputLanguage);
    for await (const chunk of generateWithGeminiNano(compactPrompt, transcription)) {
      yield { chunk, backend: 'gemini-nano' };
    }
    return;
  }

  if (isExternalAPIConfigured()) {
    // External API has a large context window — use the full rich prompt.
    const systemPrompt = buildSystemPrompt(speakingLanguage, outputLanguage);
    for await (const chunk of generateWithExternalAPI(systemPrompt, transcription)) {
      yield { chunk, backend: 'external-api' };
    }
    return;
  }

  throw new AINotConfiguredError(
    'No AI backend available. Please configure an external API endpoint in Settings.',
  );
}
