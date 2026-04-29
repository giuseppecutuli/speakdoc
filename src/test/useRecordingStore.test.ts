import { describe, it, expect, beforeEach } from 'vitest';
import { useRecordingStore } from '@/hooks/useRecordingStore';

beforeEach(() => {
  useRecordingStore.getState().reset();
});

describe('setTranscription', () => {
  it('sets transcription text directly', () => {
    useRecordingStore.getState().setTranscription('hello world');
    expect(useRecordingStore.getState().transcription).toBe('hello world');
  });

  it('sets status to done', () => {
    useRecordingStore.getState().setTranscription('some text');
    expect(useRecordingStore.getState().status).toBe('done');
  });

  it('replaces any previously appended transcription', () => {
    useRecordingStore.getState().appendTranscription('first', true);
    useRecordingStore.getState().setTranscription('replaced');
    expect(useRecordingStore.getState().transcription).toBe('replaced');
  });

  it('accepts empty string', () => {
    useRecordingStore.getState().setTranscription('something');
    useRecordingStore.getState().setTranscription('');
    expect(useRecordingStore.getState().transcription).toBe('');
    expect(useRecordingStore.getState().status).toBe('done');
  });
});

describe('appendTranscription', () => {
  it('appends final text with a space', () => {
    useRecordingStore.getState().appendTranscription('hello', true);
    useRecordingStore.getState().appendTranscription('world', true);
    expect(useRecordingStore.getState().transcription).toBe('hello world');
  });

  it('stores interim text separately', () => {
    useRecordingStore.getState().appendTranscription('typing...', false);
    expect(useRecordingStore.getState().interimTranscription).toBe('typing...');
    expect(useRecordingStore.getState().transcription).toBe('');
  });

  it('clears interim on final append', () => {
    useRecordingStore.getState().appendTranscription('draft', false);
    useRecordingStore.getState().appendTranscription('final text', true);
    expect(useRecordingStore.getState().interimTranscription).toBe('');
  });
});

describe('appendSegmentBlock', () => {
  it('sets first block without leading separator', () => {
    useRecordingStore.getState().appendSegmentBlock('  hello  ');
    expect(useRecordingStore.getState().transcription).toBe('hello');
    expect(useRecordingStore.getState().status).toBe('done');
  });

  it('appends further blocks with blank line separator', () => {
    useRecordingStore.getState().setTranscription('first');
    useRecordingStore.getState().appendSegmentBlock('second');
    expect(useRecordingStore.getState().transcription).toBe('first\n\nsecond');
  });
});

describe('beginAnotherTake', () => {
  it('returns to idle and keeps transcription', () => {
    useRecordingStore.getState().setTranscription('saved');
    useRecordingStore.getState().beginAnotherTake();
    const { status, transcription } = useRecordingStore.getState();
    expect(status).toBe('idle');
    expect(transcription).toBe('saved');
    expect(useRecordingStore.getState().audioBlob).toBeNull();
  });
});

describe('reset', () => {
  it('clears all state back to initial', () => {
    useRecordingStore.getState().setTranscription('something');
    useRecordingStore.getState().setError('oops');
    useRecordingStore.getState().reset();
    const { status, transcription, interimTranscription, audioBlob, error, capture_mode } =
      useRecordingStore.getState();
    expect(status).toBe('idle');
    expect(transcription).toBe('');
    expect(interimTranscription).toBe('');
    expect(audioBlob).toBeNull();
    expect(error).toBeNull();
    expect(capture_mode).toBeNull();
  });
});
