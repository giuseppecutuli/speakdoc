import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadSpeechPreference,
  saveSpeechPreference,
  resolveVoiceCaptureMode,
} from '@/features/voice-input/speech-preference';
import { STORAGE_KEYS } from '@/constants/config';

describe('speech-preference', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('SpeechRecognition', class {
      start(): void {
        /* mock */
      }
    });
    vi.stubGlobal('webkitSpeechRecognition', undefined);
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('migrates legacy assemblyai value to assemblyai-batch', () => {
    localStorage.setItem(STORAGE_KEYS.SPEECH_PROVIDER, 'assemblyai');
    expect(loadSpeechPreference()).toBe('assemblyai-batch');
    expect(localStorage.getItem(STORAGE_KEYS.SPEECH_PROVIDER)).toBe('assemblyai-batch');
  });

  it('resolveVoiceCaptureMode uses web speech when preference is web-speech', () => {
    saveSpeechPreference('web-speech');
    expect(resolveVoiceCaptureMode()).toBe('browser_stt');
  });

  it('resolveVoiceCaptureMode returns assemblyai_batch when key set and preference matches', () => {
    localStorage.setItem(STORAGE_KEYS.ASSEMBLYAI_API_KEY, 'k');
    saveSpeechPreference('assemblyai-batch');
    expect(resolveVoiceCaptureMode()).toBe('assemblyai_batch');
  });

  it('resolveVoiceCaptureMode returns null for assemblyai-batch without key', () => {
    saveSpeechPreference('assemblyai-batch');
    expect(resolveVoiceCaptureMode()).toBe(null);
  });
});
