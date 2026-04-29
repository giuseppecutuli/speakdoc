import { STORAGE_KEYS } from '@/constants/config';

/** Persisted speech / capture preference (localStorage). */
export type SpeechPreference = 'auto' | 'web-speech' | 'assemblyai-batch';

/** Resolved capture path for the microphone flow. */
export type VoiceCaptureMode = 'browser_stt' | 'assemblyai_batch';

function is_web_speech_available(): boolean {
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

function has_assemblyai_key(): boolean {
  return Boolean(localStorage.getItem(STORAGE_KEYS.ASSEMBLYAI_API_KEY)?.trim());
}

/**
 * Reads raw localStorage value and migrates legacy `assemblyai` (streaming) to batch mic mode.
 */
export function load_speech_preference(): SpeechPreference {
  const raw = localStorage.getItem(STORAGE_KEYS.SPEECH_PROVIDER);
  if (raw === 'assemblyai') {
    localStorage.setItem(STORAGE_KEYS.SPEECH_PROVIDER, 'assemblyai-batch');
    return 'assemblyai-batch';
  }
  if (raw === 'web-speech' || raw === 'assemblyai-batch' || raw === 'auto') {
    return raw;
  }
  return 'auto';
}

export function save_speech_preference(value: SpeechPreference): void {
  localStorage.setItem(STORAGE_KEYS.SPEECH_PROVIDER, value);
}

/**
 * Resolves which capture pipeline to use for the microphone.
 * @returns `null` if nothing is available (caller should show an error).
 */
export function resolve_voice_capture_mode(): VoiceCaptureMode | null {
  const pref = load_speech_preference();
  if (pref === 'web-speech') {
    return is_web_speech_available() ? 'browser_stt' : null;
  }
  if (pref === 'assemblyai-batch') {
    return has_assemblyai_key() ? 'assemblyai_batch' : null;
  }
  // auto
  if (is_web_speech_available()) return 'browser_stt';
  if (has_assemblyai_key()) return 'assemblyai_batch';
  return null;
}
