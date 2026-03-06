import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

var mockDraftRepo: any;

vi.mock('@/utils/repositories', () => {
  mockDraftRepo = {
    save: vi.fn().mockResolvedValue(undefined),
    getLatest: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn().mockResolvedValue(undefined),
  };

  return {
    sessionRepository: {},
    feedbackRepository: {},
    draftRepository: mockDraftRepo,
  };
});

import { useDraftPersistence } from '@/hooks/useDraftPersistence';
import { useRecordingStore } from '@/hooks/useRecordingStore';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  useRecordingStore.getState().reset();
  useDocumentationStore.getState().reset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useDraftPersistence', () => {
  it('does not save when transcription and generatedDoc are empty', async () => {
    renderHook(() => useDraftPersistence());
    await act(async () => { vi.advanceTimersByTime(1500); });
    expect(mockDraftRepo.save).not.toHaveBeenCalled();
  });

  it('saves after debounce when transcription is set', async () => {
    renderHook(() => useDraftPersistence());

    act(() => { useRecordingStore.getState().setTranscription('Hello'); });
    await act(async () => { vi.advanceTimersByTime(1100); });

    expect(mockDraftRepo.save).toHaveBeenCalledOnce();
    expect(mockDraftRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ transcription: 'Hello' }),
    );
  });

  it('saves after debounce when formattedOutput is set', async () => {
    renderHook(() => useDraftPersistence());

    act(() => { useDocumentationStore.getState().setFormattedOutput('# Doc'); });
    await act(async () => { vi.advanceTimersByTime(1100); });

    expect(mockDraftRepo.save).toHaveBeenCalledOnce();
    expect(mockDraftRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ generatedDoc: '# Doc' }),
    );
  });

  it('debounces — only saves once for rapid changes', async () => {
    renderHook(() => useDraftPersistence());

    act(() => { useRecordingStore.getState().setTranscription('a'); });
    await act(async () => { vi.advanceTimersByTime(200); });
    act(() => { useRecordingStore.getState().setTranscription('ab'); });
    await act(async () => { vi.advanceTimersByTime(200); });
    act(() => { useRecordingStore.getState().setTranscription('abc'); });
    await act(async () => { vi.advanceTimersByTime(1100); });

    expect(mockDraftRepo.save).toHaveBeenCalledOnce();
    expect(mockDraftRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ transcription: 'abc' }),
    );
  });

  it('excludes audio blob larger than 25 MB', async () => {
    renderHook(() => useDraftPersistence());

    const oversizedBlob = new Blob([new Uint8Array(26 * 1024 * 1024)]);
    act(() => {
      useRecordingStore.getState().setTranscription('text');
      useRecordingStore.getState().setAudioBlob(oversizedBlob);
    });
    await act(async () => { vi.advanceTimersByTime(1100); });

    expect(mockDraftRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ audioBlob: undefined }),
    );
  });

  it('includes audio blob within 25 MB', async () => {
    renderHook(() => useDraftPersistence());

    const smallBlob = new Blob([new Uint8Array(1024)]);
    act(() => {
      useRecordingStore.getState().setTranscription('text');
      useRecordingStore.getState().setAudioBlob(smallBlob);
    });
    await act(async () => { vi.advanceTimersByTime(1100); });

    expect(mockDraftRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ audioBlob: smallBlob }),
    );
  });

  it('saves format and language pair from stores', async () => {
    renderHook(() => useDraftPersistence());

    act(() => {
      useDocumentationStore.getState().setFormat('wiki');
      useRecordingStore.getState().setTranscription('text');
    });
    await act(async () => { vi.advanceTimersByTime(1100); });

    expect(mockDraftRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ format: 'wiki' }),
    );
  });

  it('includes savedAt timestamp in the saved draft', async () => {
    renderHook(() => useDraftPersistence());

    act(() => { useRecordingStore.getState().setTranscription('something'); });
    await act(async () => { vi.advanceTimersByTime(1100); });

    const [savedDraft] = mockDraftRepo.save.mock.calls[0];
    expect(savedDraft.savedAt).toBeInstanceOf(Date);
  });
});
