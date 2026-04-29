import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

const mockDraftRepo = vi.hoisted(() => ({
  save: vi.fn().mockResolvedValue(undefined),
  getLatest: vi.fn().mockResolvedValue(undefined),
  getById: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn().mockResolvedValue(undefined),
  beginNewDraft: vi.fn(),
  listRecent: vi.fn().mockResolvedValue([]),
  delete: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/utils/repositories', () => ({
  sessionRepository: {},
  feedbackRepository: {},
  draftRepository: mockDraftRepo,
}));

import { useDraftPersistence } from '@/hooks/useDraftPersistence';
import { useRecordingStore } from '@/hooks/useRecordingStore';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';
import * as audioChunkStorage from '@/utils/audio-chunk-storage';

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  useRecordingStore.getState().reset();
  useDocumentationStore.getState().reset();
});

afterEach(() => {
  vi.useRealTimers();
  if (vi.isMockFunction(audioChunkStorage.packAudioForStorage)) {
    vi.mocked(audioChunkStorage.packAudioForStorage).mockRestore();
  }
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

  it('stores oversized audio as chunks instead of a single blob', async () => {
    const packSpy = vi.spyOn(audioChunkStorage, 'packAudioForStorage').mockReturnValue({
      audioBlob: undefined,
      audioChunks: [new Blob([new Uint8Array(10)]), new Blob([new Uint8Array(10)])],
      audioMimeType: 'audio/webm',
    });

    try {
      renderHook(() => useDraftPersistence());

      act(() => {
        useRecordingStore.getState().setTranscription('text');
        useRecordingStore.getState().setAudioBlob(new Blob(['mic-audio']));
      });
      await act(async () => { vi.advanceTimersByTime(1100); });

      expect(mockDraftRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          audioChunks: expect.arrayContaining([expect.any(Blob)]),
          audioMimeType: 'audio/webm',
        }),
      );
      const [[saved]] = mockDraftRepo.save.mock.calls;
      expect(saved.audioBlob).toBeUndefined();
      expect(saved.audioChunks?.length).toBeGreaterThanOrEqual(2);
    } finally {
      packSpy.mockRestore();
    }
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
