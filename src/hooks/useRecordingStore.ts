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
  setAudioBlob: (blob: Blob | null) => void;
  setCaptureMode: (mode: VoiceCaptureMode | null) => void;
  setError: (error: string | null) => void;
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

  setAudioBlob: (blob) => set({ audioBlob: blob }),

  setCaptureMode: (mode) => set({ capture_mode: mode }),

  setError: (error) => set({ error }),

  reset: () => set({ ...initialState }),
}));
