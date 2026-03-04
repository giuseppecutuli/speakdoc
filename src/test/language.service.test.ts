import { describe, it, expect, beforeEach } from 'vitest';
import { loadLanguagePreferences, saveLanguagePreferences } from '@/features/language-selection/language.service';

describe('language.service', () => {
  beforeEach(() => localStorage.clear());

  it('returns defaults when nothing stored', () => {
    const prefs = loadLanguagePreferences();
    expect(prefs.speakingLanguage).toBe('it');
    expect(prefs.outputLanguage).toBe('en');
  });

  it('saves and restores preferences', () => {
    saveLanguagePreferences('en', 'it');
    const prefs = loadLanguagePreferences();
    expect(prefs.speakingLanguage).toBe('en');
    expect(prefs.outputLanguage).toBe('it');
  });

  it('ignores invalid stored values and returns defaults', () => {
    localStorage.setItem('doc-assistant:speaking-lang', 'fr');
    localStorage.setItem('doc-assistant:output-lang', 'de');
    const prefs = loadLanguagePreferences();
    expect(prefs.speakingLanguage).toBe('it');
    expect(prefs.outputLanguage).toBe('en');
  });
});
