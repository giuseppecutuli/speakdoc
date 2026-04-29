import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  load_speech_preference,
  save_speech_preference,
  resolve_voice_capture_mode,
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
    expect(load_speech_preference()).toBe('assemblyai-batch');
    expect(localStorage.getItem(STORAGE_KEYS.SPEECH_PROVIDER)).toBe('assemblyai-batch');
  });

  it('resolve_voice_capture_mode uses web speech when preference is web-speech', () => {
    save_speech_preference('web-speech');
    expect(resolve_voice_capture_mode()).toBe('browser_stt');
  });

  it('resolve_voice_capture_mode returns assemblyai_batch when key set and preference matches', () => {
    localStorage.setItem(STORAGE_KEYS.ASSEMBLYAI_API_KEY, 'k');
    save_speech_preference('assemblyai-batch');
    expect(resolve_voice_capture_mode()).toBe('assemblyai_batch');
  });

  it('resolve_voice_capture_mode returns null for assemblyai-batch without key', () => {
    save_speech_preference('assemblyai-batch');
    expect(resolve_voice_capture_mode()).toBe(null);
  });
});
