import { create } from 'zustand';
import type { OutputFormat } from '@/types/documentation';

interface DocumentationState {
  rawAIResponse: string;
  formattedOutput: string;
  selectedFormat: OutputFormat;
  isGenerating: boolean;
  error: string | null;
}

interface DocumentationActions {
  setFormat: (format: OutputFormat) => void;
  setRawResponse: (text: string) => void;
  appendRawResponse: (chunk: string) => void;
  setFormattedOutput: (text: string) => void;
  setGenerating: (generating: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: DocumentationState = {
  rawAIResponse: '',
  formattedOutput: '',
  selectedFormat: 'markdown',
  isGenerating: false,
  error: null,
};

export const useDocumentationStore = create<DocumentationState & DocumentationActions>((set) => ({
  ...initialState,

  setFormat: (format) => set({ selectedFormat: format }),

  setRawResponse: (text) => set({ rawAIResponse: text }),

  appendRawResponse: (chunk) =>
    set((state) => ({ rawAIResponse: state.rawAIResponse + chunk })),

  setFormattedOutput: (text) => set({ formattedOutput: text }),

  setGenerating: (generating) => set({ isGenerating: generating }),

  setError: (error) => set({ error }),

  reset: () => set({ ...initialState }),
}));
