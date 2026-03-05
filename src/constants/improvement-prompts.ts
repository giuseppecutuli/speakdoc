import type { LanguageCode } from '@/types/language';

export interface ImprovementPrompt {
  system: string;
  user: string;
}

const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  it: 'Italian',
};

/**
 * Builds a prompt to rewrite only the selected text excerpt.
 * The AI must return ONLY the rewritten text — no surrounding context.
 */
export const buildSelectionImprovementPrompt = (
  instruction: string,
  selectedText: string,
  outputLanguage: LanguageCode,
): ImprovementPrompt => {
  const lang = LANGUAGE_LABELS[outputLanguage];
  return {
    system: `You are a technical writing assistant. The user will provide a short text excerpt and an instruction. Rewrite ONLY the provided excerpt according to the instruction. Output language: ${lang}. Return ONLY the rewritten text — no explanations, no surrounding context, no markdown fences unless already present in the original.`,
    user: `Instruction: ${instruction}\n\nText to rewrite:\n${selectedText}`,
  };
};

/**
 * Builds a prompt to improve the entire document.
 * The AI must return ONLY the improved document — no commentary.
 */
export const buildDocumentImprovementPrompt = (
  instruction: string,
  fullContent: string,
  outputLanguage: LanguageCode,
): ImprovementPrompt => {
  const lang = LANGUAGE_LABELS[outputLanguage];
  return {
    system: `You are a technical writing assistant. The user will provide a full document and an improvement instruction. Improve the entire document according to the instruction. Output language: ${lang}. Return ONLY the improved document — no explanations, no commentary, preserve the existing structure and formatting unless instructed otherwise.`,
    user: `Instruction: ${instruction}\n\nDocument to improve:\n${fullContent}`,
  };
};
