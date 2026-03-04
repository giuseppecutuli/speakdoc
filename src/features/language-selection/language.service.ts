import type { LanguageCode } from '@/types/language';
import { STORAGE_KEYS } from '@/constants/config';
import { DEFAULT_SPEAKING_LANGUAGE, DEFAULT_OUTPUT_LANGUAGE } from '@/constants/languages';

interface StoredLanguages {
  speakingLanguage: LanguageCode;
  outputLanguage: LanguageCode;
}

const isValidLanguageCode = (value: unknown): value is LanguageCode =>
  value === 'en' || value === 'it';

export const loadLanguagePreferences = (): StoredLanguages => {
  const speaking = localStorage.getItem(STORAGE_KEYS.SPEAKING_LANGUAGE);
  const output = localStorage.getItem(STORAGE_KEYS.OUTPUT_LANGUAGE);
  return {
    speakingLanguage: isValidLanguageCode(speaking) ? speaking : DEFAULT_SPEAKING_LANGUAGE,
    outputLanguage: isValidLanguageCode(output) ? output : DEFAULT_OUTPUT_LANGUAGE,
  };
};

export const saveLanguagePreferences = (speaking: LanguageCode, output: LanguageCode): void => {
  localStorage.setItem(STORAGE_KEYS.SPEAKING_LANGUAGE, speaking);
  localStorage.setItem(STORAGE_KEYS.OUTPUT_LANGUAGE, output);
};
