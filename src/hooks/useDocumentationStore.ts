import { create } from 'zustand';
import type { OutputFormat } from '@/types/documentation';

interface DocumentationState {
  rawAIResponse: string;
  formattedOutput: string;
  selectedFormat: OutputFormat;
  isGenerating: boolean;
  error: string | null;
  savedToHistory: boolean;
  lastSavedSessionId: number | null;
  history: string[];       // undo stack: snapshots before AI edits, newest at END
  historyIndex: number;    // = history.length - 1 when at tip; tracks position
  redoStack: string[];     // redo stack: states to forward to on redo, newest at END
  pendingRestore: string | null; // set by undo/redo; component reads and clears it
  canUndo: boolean;
  canRedo: boolean;
}

interface DocumentationActions {
  setFormat: (format: OutputFormat) => void;
  setRawResponse: (text: string) => void;
  appendRawResponse: (chunk: string) => void;
  setFormattedOutput: (text: string) => void;
  setGenerating: (generating: boolean) => void;
  setError: (error: string | null) => void;
  setSavedToHistory: (saved: boolean) => void;
  setLastSavedSessionId: (id: number | null) => void;
  reset: () => void;
  pushHistory: (content: string) => void;
  undo: () => void;
  redo: () => void;
  clearPendingRestore: () => void;
}

const initialState: DocumentationState = {
  rawAIResponse: '',
  formattedOutput: '',
  selectedFormat: 'markdown',
  isGenerating: false,
  error: null,
  savedToHistory: false,
  lastSavedSessionId: null,
  history: [],
  historyIndex: -1,
  redoStack: [],
  pendingRestore: null,
  canUndo: false,
  canRedo: false,
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

  setSavedToHistory: (saved) => set({ savedToHistory: saved }),

  setLastSavedSessionId: (id) => set({ lastSavedSessionId: id }),

  reset: () => set({ ...initialState }),

  pushHistory: (content) =>
    set((state) => {
      // When a new AI edit happens, discard the redo stack
      const newHistory = [...state.history, content].slice(-20);
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
        redoStack: [],
        canUndo: true,
        canRedo: false,
      };
    }),

  undo: () =>
    set((state) => {
      if (state.history.length === 0) return {};
      const restored = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);
      const newRedoStack = [...state.redoStack, state.formattedOutput];
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
        redoStack: newRedoStack,
        pendingRestore: restored,
        canUndo: newHistory.length > 0,
        canRedo: true,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.redoStack.length === 0) return {};
      const restored = state.redoStack[state.redoStack.length - 1];
      const newRedoStack = state.redoStack.slice(0, -1);
      const newHistory = [...state.history, state.formattedOutput];
      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
        redoStack: newRedoStack,
        pendingRestore: restored,
        canUndo: true,
        canRedo: newRedoStack.length > 0,
      };
    }),

  clearPendingRestore: () => set({ pendingRestore: null }),
}));
