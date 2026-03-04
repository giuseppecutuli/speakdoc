import { create } from 'zustand';
import type { RecordingStatus } from '@/types/voice';

interface RecordingState {
  status: RecordingStatus;
  transcription: string;
  interimTranscription: string;
  audioBlob: Blob | null;
  error: string | null;
}

interface RecordingActions {
  setStatus: (status: RecordingStatus) => void;
  appendTranscription: (text: string, isFinal: boolean) => void;
  setAudioBlob: (blob: Blob) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: RecordingState = {
  status: 'idle',
  transcription: '',
  interimTranscription: '',
  audioBlob: null,
  error: null,
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

  setAudioBlob: (blob) => set({ audioBlob: blob }),

  setError: (error) => set({ error }),

  reset: () => set({ ...initialState }),
}));
