import type { LanguageCode } from '@/types/language';
import type { SpeechProviderName } from '@/features/voice-input/types/speech-provider';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';

/**
 * Returns the language code formatted for the given speech provider:
 * - web-speech → BCP 47 (e.g. 'it-IT', 'en-US')
 * - assemblyai → ISO 639-1 (e.g. 'it', 'en')
 */
export const getLanguageCodeForProvider = (
  language: LanguageCode,
  provider: SpeechProviderName,
): string => {
  switch (provider) {
    case 'assemblyai':
      return language; // ISO 639-1 (AssemblyAI language mapping handled in service)
    case 'web-speech':
    default:
      return SUPPORTED_LANGUAGES[language].speechCode; // BCP 47
  }
};
