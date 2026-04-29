import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockDraftRepo = vi.hoisted(() => ({
  save: vi.fn().mockResolvedValue({ id: 1 }),
  getById: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  beginNewDraft: vi.fn(),
  delete: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/utils/repositories', () => ({
  sessionRepository: {},
  feedbackRepository: {},
  draftRepository: mockDraftRepo,
}));

import { STORAGE_KEYS } from '@/constants/config';
import type { SessionDraft } from '@/types/session';
import { useRecordingStore } from '@/hooks/useRecordingStore';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';
import {
  hasPersistableDraftContent,
  persistCurrentDraftNow,
  deleteActiveDraftIfAny,
  resetWorkspaceStores,
  beginNewWorkspaceSession,
  getActiveDraftId,
} from '@/features/learning/session-draft-actions';

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useRecordingStore.getState().reset();
  useDocumentationStore.getState().reset();
});

afterEach(() => {
  localStorage.clear();
});

describe('hasPersistableDraftContent', () => {
  it('is false when transcription and doc are empty', () => {
    expect(hasPersistableDraftContent()).toBe(false);
  });

  it('is true when transcription is non-empty', () => {
    useRecordingStore.getState().setTranscription('x');
    expect(hasPersistableDraftContent()).toBe(true);
  });

  it('is true when formatted output is non-empty', () => {
    useDocumentationStore.getState().setFormattedOutput('# Doc');
    expect(hasPersistableDraftContent()).toBe(true);
  });
});

describe('persistCurrentDraftNow', () => {
  it('does not call save when both are empty', async () => {
    const result = await persistCurrentDraftNow();
    expect(mockDraftRepo.save).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('calls save with store snapshot when transcription is set and returns saved row', async () => {
    mockDraftRepo.save.mockResolvedValueOnce({ id: 99, transcription: 'Hello' } as SessionDraft);
    useRecordingStore.getState().setTranscription('Hello');
    const result = await persistCurrentDraftNow();
    expect(mockDraftRepo.save).toHaveBeenCalledOnce();
    expect(mockDraftRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ transcription: 'Hello' }),
    );
    expect(result).toEqual(expect.objectContaining({ id: 99 }));
  });
});

describe('getActiveDraftId', () => {
  it('returns null when pointer is missing', () => {
    expect(getActiveDraftId()).toBeNull();
  });

  it('returns numeric id from localStorage', () => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_DRAFT_ID, '7');
    expect(getActiveDraftId()).toBe(7);
  });

  it('returns null for invalid id and clears the pointer', () => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_DRAFT_ID, 'x');
    expect(getActiveDraftId()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.ACTIVE_DRAFT_ID)).toBeNull();
  });
});

describe('deleteActiveDraftIfAny', () => {
  it('deletes when active draft id is set', async () => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_DRAFT_ID, '42');
    await deleteActiveDraftIfAny();
    expect(mockDraftRepo.delete).toHaveBeenCalledWith(42);
  });

  it('does nothing when no active id', async () => {
    await deleteActiveDraftIfAny();
    expect(mockDraftRepo.delete).not.toHaveBeenCalled();
  });
});

describe('beginNewWorkspaceSession', () => {
  it('skips save when empty, still begins new draft and resets stores', async () => {
    await beginNewWorkspaceSession();
    expect(mockDraftRepo.save).not.toHaveBeenCalled();
    expect(mockDraftRepo.beginNewDraft).toHaveBeenCalledOnce();
    expect(useRecordingStore.getState().transcription).toBe('');
    expect(useDocumentationStore.getState().formattedOutput).toBe('');
  });

  it('saves then begins new draft when there is content', async () => {
    useRecordingStore.getState().setTranscription('Keep me');
    await beginNewWorkspaceSession();
    expect(mockDraftRepo.save).toHaveBeenCalledOnce();
    expect(mockDraftRepo.beginNewDraft).toHaveBeenCalledOnce();
    expect(useRecordingStore.getState().transcription).toBe('');
  });
});

describe('resetWorkspaceStores', () => {
  it('clears recording and documentation stores', () => {
    useRecordingStore.getState().setTranscription('a');
    useDocumentationStore.getState().setFormattedOutput('b');
    resetWorkspaceStores();
    expect(useRecordingStore.getState().transcription).toBe('');
    expect(useDocumentationStore.getState().formattedOutput).toBe('');
  });
});
