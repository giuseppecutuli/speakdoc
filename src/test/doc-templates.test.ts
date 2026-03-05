import { describe, it, expect } from 'vitest';
import { buildSystemPrompt, buildCompactPrompt, SYSTEM_PROMPTS, COMPACT_PROMPTS } from '@/constants/prompts';
import { DOC_TEMPLATES, DEFAULT_TEMPLATE_ID, TEMPLATE_IDS } from '@/constants/doc-templates';
import type { TemplateId } from '@/constants/doc-templates';
import type { LanguageCode } from '@/types/language';

const LANGUAGE_PAIRS: Array<[LanguageCode, LanguageCode]> = [
  ['en', 'en'],
  ['en', 'it'],
  ['it', 'en'],
  ['it', 'it'],
];

const NON_GENERIC_TEMPLATES: TemplateId[] = TEMPLATE_IDS.filter((id) => id !== 'generic');

describe('DOC_TEMPLATES', () => {
  it('has all 5 templates defined', () => {
    expect(TEMPLATE_IDS).toHaveLength(5);
    expect(TEMPLATE_IDS).toContain('generic');
    expect(TEMPLATE_IDS).toContain('meeting-notes');
    expect(TEMPLATE_IDS).toContain('tech-spec');
    expect(TEMPLATE_IDS).toContain('adr');
    expect(TEMPLATE_IDS).toContain('bug-report');
  });

  it('generic template has empty promptModifier', () => {
    expect(DOC_TEMPLATES['generic'].promptModifier).toBe('');
  });

  it.each(NON_GENERIC_TEMPLATES)('%s template has non-empty promptModifier', (id) => {
    expect(DOC_TEMPLATES[id].promptModifier.length).toBeGreaterThan(0);
  });

  it('DEFAULT_TEMPLATE_ID is generic', () => {
    expect(DEFAULT_TEMPLATE_ID).toBe('generic');
  });
});

describe('buildSystemPrompt with templates', () => {
  it('returns base prompt unchanged for generic template', () => {
    for (const [speaking, output] of LANGUAGE_PAIRS) {
      const result = buildSystemPrompt(speaking, output, 'generic');
      const key = `${speaking}→${output}` as keyof typeof SYSTEM_PROMPTS;
      expect(result).toBe(SYSTEM_PROMPTS[key]);
    }
  });

  it('defaults to generic when templateId is omitted', () => {
    for (const [speaking, output] of LANGUAGE_PAIRS) {
      const withDefault = buildSystemPrompt(speaking, output);
      const withGeneric = buildSystemPrompt(speaking, output, 'generic');
      expect(withDefault).toBe(withGeneric);
    }
  });

  it.each(NON_GENERIC_TEMPLATES)('appends %s modifier to base prompt', (templateId) => {
    for (const [speaking, output] of LANGUAGE_PAIRS) {
      const result = buildSystemPrompt(speaking, output, templateId);
      const key = `${speaking}→${output}` as keyof typeof SYSTEM_PROMPTS;
      const base = SYSTEM_PROMPTS[key];
      const modifier = DOC_TEMPLATES[templateId].promptModifier;
      expect(result).toBe(base + modifier);
      expect(result.startsWith(base)).toBe(true);
      expect(result.endsWith(modifier)).toBe(true);
    }
  });
});

describe('buildCompactPrompt with templates', () => {
  it('returns base prompt unchanged for generic template', () => {
    for (const [speaking, output] of LANGUAGE_PAIRS) {
      const result = buildCompactPrompt(speaking, output, 'generic');
      const key = `${speaking}→${output}` as keyof typeof COMPACT_PROMPTS;
      expect(result).toBe(COMPACT_PROMPTS[key]);
    }
  });

  it('defaults to generic when templateId is omitted', () => {
    for (const [speaking, output] of LANGUAGE_PAIRS) {
      const withDefault = buildCompactPrompt(speaking, output);
      const withGeneric = buildCompactPrompt(speaking, output, 'generic');
      expect(withDefault).toBe(withGeneric);
    }
  });

  it.each(NON_GENERIC_TEMPLATES)('appends %s modifier to compact base prompt', (templateId) => {
    for (const [speaking, output] of LANGUAGE_PAIRS) {
      const result = buildCompactPrompt(speaking, output, templateId);
      const key = `${speaking}→${output}` as keyof typeof COMPACT_PROMPTS;
      const base = COMPACT_PROMPTS[key];
      const modifier = DOC_TEMPLATES[templateId].promptModifier;
      expect(result).toBe(base + modifier);
    }
  });
});

describe('template prompt content', () => {
  it('meeting-notes modifier mentions meeting notes structure', () => {
    const modifier = DOC_TEMPLATES['meeting-notes'].promptModifier;
    expect(modifier).toContain('Meeting Notes');
    expect(modifier).toContain('Action items');
  });

  it('tech-spec modifier mentions technical specification', () => {
    const modifier = DOC_TEMPLATES['tech-spec'].promptModifier;
    expect(modifier).toContain('Technical Specification');
    expect(modifier).toContain('Architecture');
  });

  it('adr modifier mentions ADR fields', () => {
    const modifier = DOC_TEMPLATES['adr'].promptModifier;
    expect(modifier).toContain('ADR');
    expect(modifier).toContain('Context');
    expect(modifier).toContain('Decision');
    expect(modifier).toContain('Consequences');
  });

  it('bug-report modifier mentions bug report fields', () => {
    const modifier = DOC_TEMPLATES['bug-report'].promptModifier;
    expect(modifier).toContain('Bug Report');
    expect(modifier).toContain('Steps to Reproduce');
    expect(modifier).toContain('Expected Behavior');
  });
});
