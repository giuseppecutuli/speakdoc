import type { LanguageCode, LanguageConfig } from '@/types/language';

export const SUPPORTED_LANGUAGES: Record<LanguageCode, LanguageConfig> = {
  en: {
    code: 'en',
    label: 'English',
    nativeLabel: 'English',
    speechCode: 'en-US',
  },
  it: {
    code: 'it',
    label: 'Italian',
    nativeLabel: 'Italiano',
    speechCode: 'it-IT',
  },
};

export const LANGUAGE_OPTIONS = Object.values(SUPPORTED_LANGUAGES);

export const DEFAULT_SPEAKING_LANGUAGE: LanguageCode = 'it';
export const DEFAULT_OUTPUT_LANGUAGE: LanguageCode = 'en';
