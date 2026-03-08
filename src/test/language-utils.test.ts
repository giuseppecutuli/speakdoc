import { describe, it, expect } from 'vitest';
import { getLanguageCodeForProvider } from '@/utils/language-utils';

describe('getLanguageCodeForProvider', () => {
  describe('web-speech provider (BCP 47)', () => {
    it('returns it-IT for Italian', () => {
      expect(getLanguageCodeForProvider('it', 'web-speech')).toBe('it-IT');
    });

    it('returns en-US for English', () => {
      expect(getLanguageCodeForProvider('en', 'web-speech')).toBe('en-US');
    });
  });

  describe('assemblyai provider (ISO 639-1)', () => {
    it('returns it for Italian', () => {
      expect(getLanguageCodeForProvider('it', 'assemblyai')).toBe('it');
    });

    it('returns en for English', () => {
      expect(getLanguageCodeForProvider('en', 'assemblyai')).toBe('en');
    });
  });
});
