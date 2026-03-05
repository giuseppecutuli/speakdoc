import type { LanguageCode } from '@/types/language';
import { AINotConfiguredError } from '@/types/ai';
import {
  buildSelectionImprovementPrompt,
  buildDocumentImprovementPrompt,
} from '@/constants/improvement-prompts';
import { isGeminiNanoAvailable, generateWithGeminiNano } from '@/features/ai-integration/gemini-nano.service';
import { isExternalAPIConfigured, generateWithExternalAPI } from '@/features/ai-integration/external-api.service';

async function* callAI(system: string, user: string): AsyncGenerator<string> {
  if (await isGeminiNanoAvailable()) {
    yield* generateWithGeminiNano(system, user);
    return;
  }
  if (isExternalAPIConfigured()) {
    yield* generateWithExternalAPI(system, user);
    return;
  }
  throw new AINotConfiguredError(
    'No AI backend available. Please configure an external API endpoint in Settings.',
  );
}

/**
 * Streams an AI rewrite of only the selected text excerpt.
 * Caller is responsible for replacing [selectionStart, selectionEnd] in the document.
 */
export async function* improveSelection(
  selectedText: string,
  instruction: string,
  outputLanguage: LanguageCode,
): AsyncGenerator<string> {
  const { system, user } = buildSelectionImprovementPrompt(instruction, selectedText, outputLanguage);
  yield* callAI(system, user);
}

/**
 * Streams an AI rewrite of the full document content.
 */
export async function* improveDocument(
  fullContent: string,
  instruction: string,
  outputLanguage: LanguageCode,
): AsyncGenerator<string> {
  const { system, user } = buildDocumentImprovementPrompt(instruction, fullContent, outputLanguage);
  yield* callAI(system, user);
}
