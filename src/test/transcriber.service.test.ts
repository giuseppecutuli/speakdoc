import { describe, it, expect, beforeEach } from 'vitest';
import { TranscriberService } from '@/features/transcription/transcriber.service';

describe('TranscriberService', () => {
  let svc: TranscriberService;

  beforeEach(() => {
    svc = new TranscriberService();
  });

  it('appends final results', () => {
    svc.appendResult('hello', true);
    expect(svc.getFullTranscript()).toBe('hello');
  });

  it('concatenates multiple final results with space', () => {
    svc.appendResult('hello', true);
    svc.appendResult('world', true);
    expect(svc.getFullTranscript()).toBe('hello world');
  });

  it('stores interim result separately', () => {
    svc.appendResult('hello', true);
    svc.appendResult('wor', false);
    const transcript = svc.getFullTranscript();
    expect(transcript).toContain('hello');
    expect(transcript).toContain('wor');
  });

  it('replaces interim with new interim', () => {
    svc.appendResult('int1', false);
    svc.appendResult('int2', false);
    const { interim } = svc.appendResult('int2', false);
    expect(interim).toBe('int2');
  });

  it('clears interim when final arrives', () => {
    svc.appendResult('temp', false);
    svc.appendResult('final', true);
    const { interim } = svc.appendResult('final', true);
    expect(interim).toBe('');
  });

  it('resets state', () => {
    svc.appendResult('hello', true);
    svc.reset();
    expect(svc.getFullTranscript()).toBe('');
  });
});
