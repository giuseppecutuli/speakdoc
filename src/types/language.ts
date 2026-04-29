export type LanguageCode = 'en' | 'it';

const LANGUAGE_CODES = ['en', 'it'] as const satisfies readonly LanguageCode[];

/** Normalizes wire/storage strings to {@link LanguageCode} (e.g. IndexedDB draft rows). */
export function coerceLanguageCode(value: string, fallback: LanguageCode = 'en'): LanguageCode {
  return (LANGUAGE_CODES as readonly string[]).includes(value) ? (value as LanguageCode) : fallback;
}

export interface LanguageConfig {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  speechCode: string; // BCP 47
}

export interface LanguageSession {
  speakingLanguage: LanguageCode;
  outputLanguage: LanguageCode;
  locked: boolean;
}

export type LanguagePair = `${LanguageCode}→${LanguageCode}`;
