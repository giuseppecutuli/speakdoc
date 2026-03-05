import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAudioUrl, revokeAudioUrl } from '@/utils/audio-url';

describe('audio-url', () => {
  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/test-id');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  describe('createAudioUrl', () => {
    it('calls URL.createObjectURL with the blob', () => {
      const blob = new Blob(['audio data'], { type: 'audio/webm' });
      const url = createAudioUrl(blob);
      expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
      expect(url).toBe('blob:http://localhost/test-id');
    });
  });

  describe('revokeAudioUrl', () => {
    it('calls URL.revokeObjectURL with the url', () => {
      revokeAudioUrl('blob:http://localhost/test-id');
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:http://localhost/test-id');
    });
  });
});
