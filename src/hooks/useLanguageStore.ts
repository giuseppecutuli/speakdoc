import { create } from 'zustand';
import type { LanguageCode } from '@/types/language';
import { DEFAULT_SPEAKING_LANGUAGE, DEFAULT_OUTPUT_LANGUAGE } from '@/constants/languages';
import { STORAGE_KEYS } from '@/constants/config';

interface LanguageState {
  speakingLanguage: LanguageCode;
  outputLanguage: LanguageCode;
  sessionLocked: boolean;
}

interface LanguageActions {
  setLanguages: (speaking: LanguageCode, output: LanguageCode) => void;
  lockSession: () => void;
  unlockSession: () => void;
  loadFromStorage: () => void;
}

const loadStoredLanguage = (key: string, fallback: LanguageCode): LanguageCode => {
  const stored = localStorage.getItem(key);
  return stored === 'en' || stored === 'it' ? stored : fallback;
};

export const useLanguageStore = create<LanguageState & LanguageActions>((set) => ({
  speakingLanguage: DEFAULT_SPEAKING_LANGUAGE,
  outputLanguage: DEFAULT_OUTPUT_LANGUAGE,
  sessionLocked: false,

  setLanguages: (speaking, output) => {
    localStorage.setItem(STORAGE_KEYS.SPEAKING_LANGUAGE, speaking);
    localStorage.setItem(STORAGE_KEYS.OUTPUT_LANGUAGE, output);
    set({ speakingLanguage: speaking, outputLanguage: output });
  },

  lockSession: () => set({ sessionLocked: true }),

  unlockSession: () => set({ sessionLocked: false }),

  loadFromStorage: () =>
    set({
      speakingLanguage: loadStoredLanguage(STORAGE_KEYS.SPEAKING_LANGUAGE, DEFAULT_SPEAKING_LANGUAGE),
      outputLanguage: loadStoredLanguage(STORAGE_KEYS.OUTPUT_LANGUAGE, DEFAULT_OUTPUT_LANGUAGE),
    }),
}));
