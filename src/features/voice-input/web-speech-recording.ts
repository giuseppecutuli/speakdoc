import type { LanguageCode } from '@/types/language';
import type { SpeechProviderManager } from './SpeechProviderManager';

/**
 * Starts browser Web Speech on the given manager (used from record + pause/resume flows).
 */
export function startBrowserSttForRecording(
  manager: SpeechProviderManager,
  speakingLanguage: LanguageCode,
  appendTranscription: (text: string, isFinal: boolean) => void,
  setError: (message: string) => void,
): void {
  manager.start(
    speakingLanguage,
    {
      onResult: ({ transcript, isFinal }) => appendTranscription(transcript, isFinal),
      onError: (err) => setError(err),
      onEnd: () => {},
    },
    'web-speech',
  );
}
