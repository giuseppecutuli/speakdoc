import { describe, it, expect, beforeEach } from 'vitest';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';

beforeEach(() => {
  useDocumentationStore.getState().reset();
});

describe('pushHistory', () => {
  it('adds a snapshot to history and sets canUndo', () => {
    useDocumentationStore.getState().pushHistory('before edit');
    const { history, canUndo, canRedo } = useDocumentationStore.getState();
    expect(history).toEqual(['before edit']);
    expect(canUndo).toBe(true);
    expect(canRedo).toBe(false);
  });

  it('caps history at 20 entries', () => {
    for (let i = 0; i < 25; i++) {
      useDocumentationStore.getState().pushHistory(`state-${i}`);
    }
    const { history } = useDocumentationStore.getState();
    expect(history).toHaveLength(20);
    expect(history[history.length - 1]).toBe('state-24');
  });

  it('clears redoStack on new push (new edit discards redo branch)', () => {
    useDocumentationStore.getState().pushHistory('s1');
    useDocumentationStore.getState().setFormattedOutput('s2');
    useDocumentationStore.getState().undo();
    expect(useDocumentationStore.getState().canRedo).toBe(true);

    useDocumentationStore.getState().pushHistory('s3');
    expect(useDocumentationStore.getState().canRedo).toBe(false);
    expect(useDocumentationStore.getState().redoStack).toHaveLength(0);
  });
});

describe('undo', () => {
  it('restores previous snapshot via pendingRestore', () => {
    useDocumentationStore.getState().setFormattedOutput('current');
    useDocumentationStore.getState().pushHistory('before');
    useDocumentationStore.getState().setFormattedOutput('after-ai');

    useDocumentationStore.getState().undo();
    expect(useDocumentationStore.getState().pendingRestore).toBe('before');
  });

  it('moves current content to redoStack', () => {
    useDocumentationStore.getState().setFormattedOutput('after-ai');
    useDocumentationStore.getState().pushHistory('before');
    useDocumentationStore.getState().undo();
    expect(useDocumentationStore.getState().redoStack).toContain('after-ai');
  });

  it('does nothing when history is empty', () => {
    useDocumentationStore.getState().undo();
    const { pendingRestore, history } = useDocumentationStore.getState();
    expect(pendingRestore).toBeNull();
    expect(history).toHaveLength(0);
  });

  it('updates canUndo / canRedo after undo', () => {
    useDocumentationStore.getState().pushHistory('s1');
    useDocumentationStore.getState().undo();
    expect(useDocumentationStore.getState().canUndo).toBe(false);
    expect(useDocumentationStore.getState().canRedo).toBe(true);
  });
});

describe('redo', () => {
  it('restores forward state via pendingRestore', () => {
    useDocumentationStore.getState().pushHistory('before');
    useDocumentationStore.getState().setFormattedOutput('after-ai');
    useDocumentationStore.getState().undo();
    useDocumentationStore.getState().setFormattedOutput('before'); // simulate component restore
    useDocumentationStore.getState().clearPendingRestore();

    useDocumentationStore.getState().redo();
    expect(useDocumentationStore.getState().pendingRestore).toBe('after-ai');
  });

  it('does nothing when redoStack is empty', () => {
    useDocumentationStore.getState().redo();
    expect(useDocumentationStore.getState().pendingRestore).toBeNull();
  });

  it('updates canRedo / canUndo after redo', () => {
    useDocumentationStore.getState().pushHistory('s1');
    useDocumentationStore.getState().setFormattedOutput('s2');
    useDocumentationStore.getState().undo();
    useDocumentationStore.getState().setFormattedOutput('s1');
    useDocumentationStore.getState().clearPendingRestore();

    useDocumentationStore.getState().redo();
    expect(useDocumentationStore.getState().canRedo).toBe(false);
    expect(useDocumentationStore.getState().canUndo).toBe(true);
  });
});

describe('reset', () => {
  it('clears history on reset', () => {
    useDocumentationStore.getState().pushHistory('s1');
    useDocumentationStore.getState().reset();
    const { history, historyIndex, redoStack, canUndo, canRedo } =
      useDocumentationStore.getState();
    expect(history).toHaveLength(0);
    expect(historyIndex).toBe(-1);
    expect(redoStack).toHaveLength(0);
    expect(canUndo).toBe(false);
    expect(canRedo).toBe(false);
  });
});
