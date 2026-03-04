import { describe, it, expect } from 'vitest';
import {
  buildSystemPrompt,
  buildCompactPrompt,
  SYSTEM_PROMPTS,
  COMPACT_PROMPTS,
} from '@/constants/prompts';

describe('buildSystemPrompt (full — external API)', () => {
  it('returns it→en prompt for Italian speaking, English output', () => {
    const prompt = buildSystemPrompt('it', 'en');
    expect(prompt).toBe(SYSTEM_PROMPTS['it→en']);
    expect(prompt).toContain('English');
  });

  it('returns en→en prompt for English speaking, English output', () => {
    const prompt = buildSystemPrompt('en', 'en');
    expect(prompt).toBe(SYSTEM_PROMPTS['en→en']);
    expect(prompt).toContain('English only');
  });

  it('returns en→it prompt for English speaking, Italian output', () => {
    const prompt = buildSystemPrompt('en', 'it');
    expect(prompt).toBe(SYSTEM_PROMPTS['en→it']);
    expect(prompt).toContain('italiano');
  });

  it('returns it→it prompt for Italian speaking, Italian output', () => {
    const prompt = buildSystemPrompt('it', 'it');
    expect(prompt).toBe(SYSTEM_PROMPTS['it→it']);
    expect(prompt).toContain('italiano');
  });

  it('all 4 full prompts are defined and non-empty', () => {
    const pairs = ['it→en', 'en→en', 'en→it', 'it→it'] as const;
    for (const pair of pairs) {
      expect(SYSTEM_PROMPTS[pair]).toBeTruthy();
      expect(SYSTEM_PROMPTS[pair].length).toBeGreaterThan(50);
    }
  });

  it('cross-language prompts contain explicit translation instruction', () => {
    expect(SYSTEM_PROMPTS['it→en']).toContain('Step 1');
    expect(SYSTEM_PROMPTS['it→en']).toContain('Translate');
    expect(SYSTEM_PROMPTS['en→it']).toContain('Passaggio 1');
    expect(SYSTEM_PROMPTS['en→it']).toContain('Traduci');
  });

  it('full prompts contain mermaid diagram instruction', () => {
    expect(SYSTEM_PROMPTS['en→en']).toContain('mermaid');
    expect(SYSTEM_PROMPTS['it→it']).toContain('mermaid');
  });
});

describe('buildCompactPrompt (compact — Gemini Nano)', () => {
  it('returns it→en compact prompt for Italian speaking, English output', () => {
    const prompt = buildCompactPrompt('it', 'en');
    expect(prompt).toBe(COMPACT_PROMPTS['it→en']);
    expect(prompt).toContain('English only');
  });

  it('returns en→en compact prompt for English speaking, English output', () => {
    const prompt = buildCompactPrompt('en', 'en');
    expect(prompt).toBe(COMPACT_PROMPTS['en→en']);
    expect(prompt).toContain('English only');
  });

  it('returns en→it compact prompt for English speaking, Italian output', () => {
    const prompt = buildCompactPrompt('en', 'it');
    expect(prompt).toBe(COMPACT_PROMPTS['en→it']);
    expect(prompt).toContain('italiano');
  });

  it('returns it→it compact prompt for Italian speaking, Italian output', () => {
    const prompt = buildCompactPrompt('it', 'it');
    expect(prompt).toBe(COMPACT_PROMPTS['it→it']);
    expect(prompt).toContain('italiano');
  });

  it('all 4 compact prompts are defined and shorter than full prompts', () => {
    const pairs = ['it→en', 'en→en', 'en→it', 'it→it'] as const;
    for (const pair of pairs) {
      expect(COMPACT_PROMPTS[pair]).toBeTruthy();
      expect(COMPACT_PROMPTS[pair].length).toBeGreaterThan(50);
      expect(COMPACT_PROMPTS[pair].length).toBeLessThan(SYSTEM_PROMPTS[pair].length);
    }
  });

  it('cross-language compact prompts contain explicit translation step', () => {
    expect(COMPACT_PROMPTS['it→en']).toContain('Step 1');
    expect(COMPACT_PROMPTS['it→en']).toContain('translation');
    expect(COMPACT_PROMPTS['en→it']).toContain('Passaggio 1');
    expect(COMPACT_PROMPTS['en→it']).toContain('traduzione');
  });

  it('compact prompts do not contain mermaid diagrams', () => {
    const pairs = ['it→en', 'en→en', 'en→it', 'it→it'] as const;
    for (const pair of pairs) {
      expect(COMPACT_PROMPTS[pair]).not.toContain('mermaid');
    }
  });
});
