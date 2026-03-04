export type LanguageCode = 'en' | 'it';

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
