import { describe, it, expect } from 'vitest';
import { analyzePatterns, generateSuggestions } from '@/features/learning/learning-engine.service';
import type { DocumentationSession } from '@/types/session';

const makeSession = (overrides: Partial<DocumentationSession> = {}): DocumentationSession => ({
  speakingLanguage: 'it',
  outputLanguage: 'en',
  transcription: 'test',
  generatedDoc: 'doc',
  format: 'markdown',
  aiBackend: 'external-api',
  createdAt: new Date(),
  ...overrides,
});

describe('analyzePatterns', () => {
  it('returns null for fewer than 5 sessions', () => {
    const sessions = [makeSession(), makeSession(), makeSession()];
    expect(analyzePatterns(sessions)).toBeNull();
  });

  it('returns pattern for 5+ sessions', () => {
    const sessions = Array.from({ length: 5 }, () => makeSession());
    const pattern = analyzePatterns(sessions);
    expect(pattern).not.toBeNull();
    expect(pattern?.totalSessions).toBe(5);
  });

  it('identifies most used format', () => {
    const sessions = [
      makeSession({ format: 'wiki' }),
      makeSession({ format: 'wiki' }),
      makeSession({ format: 'markdown' }),
      makeSession({ format: 'markdown' }),
      makeSession({ format: 'wiki' }),
    ];
    const pattern = analyzePatterns(sessions);
    expect(pattern?.mostUsedFormat).toBe('wiki');
  });

  it('identifies most used language pair', () => {
    const sessions = [
      makeSession({ speakingLanguage: 'it', outputLanguage: 'en' }),
      makeSession({ speakingLanguage: 'it', outputLanguage: 'en' }),
      makeSession({ speakingLanguage: 'en', outputLanguage: 'en' }),
      makeSession({ speakingLanguage: 'it', outputLanguage: 'en' }),
      makeSession({ speakingLanguage: 'en', outputLanguage: 'it' }),
    ];
    const pattern = analyzePatterns(sessions);
    expect(pattern?.mostUsedLanguagePair).toBe('it→en');
  });
});

describe('generateSuggestions', () => {
  const pattern = {
    mostUsedFormat: 'markdown' as const,
    mostUsedLanguagePair: 'it→en' as const,
    totalSessions: 10,
  };

  it('generates 3 suggestions in English', () => {
    const suggestions = generateSuggestions(pattern, 'en');
    expect(suggestions).toHaveLength(3);
    for (const s of suggestions) {
      expect(typeof s).toBe('string');
      expect(s.length).toBeGreaterThan(0);
    }
  });

  it('generates 3 suggestions in Italian', () => {
    const suggestions = generateSuggestions(pattern, 'it');
    expect(suggestions).toHaveLength(3);
  });

  it('English suggestions mention the format', () => {
    const suggestions = generateSuggestions(pattern, 'en');
    expect(suggestions[0]).toContain('MARKDOWN');
  });

  it('Italian suggestions are in Italian', () => {
    const suggestions = generateSuggestions(pattern, 'it');
    expect(suggestions[0]).toMatch(/Stai|formato|sessioni/);
  });
});
