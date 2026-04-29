import { STORAGE_KEYS } from '@/constants/config';

/** Persisted speech / capture preference (localStorage). */
export type SpeechPreference = 'auto' | 'web-speech' | 'assemblyai-batch';

/** Resolved capture path for the microphone flow. */
export type VoiceCaptureMode = 'browser_stt' | 'assemblyai_batch';

function isWebSpeechAvailable(): boolean {
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

function hasAssemblyAiKey(): boolean {
  return Boolean(localStorage.getItem(STORAGE_KEYS.ASSEMBLYAI_API_KEY)?.trim());
}

/**
 * Reads raw localStorage value and migrates legacy `assemblyai` (streaming) to batch mic mode.
 */
export function loadSpeechPreference(): SpeechPreference {
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

export function saveSpeechPreference(value: SpeechPreference): void {
  localStorage.setItem(STORAGE_KEYS.SPEECH_PROVIDER, value);
}

/**
 * Resolves which capture pipeline to use for the microphone.
 * @returns `null` if nothing is available (caller should show an error).
 */
export function resolveVoiceCaptureMode(): VoiceCaptureMode | null {
  const pref = loadSpeechPreference();
  if (pref === 'web-speech') {
    return isWebSpeechAvailable() ? 'browser_stt' : null;
  }
  if (pref === 'assemblyai-batch') {
    return hasAssemblyAiKey() ? 'assemblyai_batch' : null;
  }
  // auto
  if (isWebSpeechAvailable()) return 'browser_stt';
  if (hasAssemblyAiKey()) return 'assemblyai_batch';
  return null;
}
