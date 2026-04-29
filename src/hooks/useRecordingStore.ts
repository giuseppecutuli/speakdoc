import { create } from 'zustand';
import type { RecordingStatus } from '@/types/voice';
import type { VoiceCaptureMode } from '@/features/voice-input/speech-preference';

interface RecordingState {
  status: RecordingStatus;
  transcription: string;
  interimTranscription: string;
  audioBlob: Blob | null;
  error: string | null;
  /** Mic pipeline active for this recording (for UI hints). */
  capture_mode: VoiceCaptureMode | null;
}

interface RecordingActions {
  setStatus: (status: RecordingStatus) => void;
  appendTranscription: (text: string, isFinal: boolean) => void;
  setTranscription: (text: string) => void;
  /** Append a finished block (file / paste / merged mic segment), separated from prior text by a blank line */
  appendSegmentBlock: (text: string) => void;
  setAudioBlob: (blob: Blob | null) => void;
  setCaptureMode: (mode: VoiceCaptureMode | null) => void;
  setError: (error: string | null) => void;
  /** After a completed take, return to idle while keeping transcription (e.g. record another segment). */
  beginAnotherTake: () => void;
  reset: () => void;
}

const initialState: RecordingState = {
  status: 'idle',
  transcription: '',
  interimTranscription: '',
  audioBlob: null,
  error: null,
  capture_mode: null,
};

export const useRecordingStore = create<RecordingState & RecordingActions>((set) => ({
  ...initialState,

  setStatus: (status) => set({ status }),

  appendTranscription: (text, isFinal) =>
    set((state) => {
      if (isFinal) {
        return {
          transcription: state.transcription ? `${state.transcription} ${text}` : text,
          interimTranscription: '',
        };
      }
      return { interimTranscription: text };
    }),

  setTranscription: (text) =>
    set({ transcription: text, interimTranscription: '', status: 'done' }),

  appendSegmentBlock: (text) =>
    set((state) => {
      const t = text.trim();
      if (!t) return { status: 'done', interimTranscription: '' };
      const base = state.transcription.trim();
      return {
        transcription: base ? `${base}\n\n${t}` : t,
        interimTranscription: '',
        status: 'done',
      };
    }),

  setAudioBlob: (blob) => set({ audioBlob: blob }),

  setCaptureMode: (mode) => set({ capture_mode: mode }),

  setError: (error) => set({ error }),

  beginAnotherTake: () =>
    set((state) => ({
      status: 'idle',
      audioBlob: null,
      interimTranscription: '',
      error: null,
      capture_mode: null,
      transcription: state.transcription,
    })),

  reset: () => set({ ...initialState }),
}));
