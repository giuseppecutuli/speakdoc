import { describe, it, expect } from 'vitest';
import {
  buildSelectionImprovementPrompt,
  buildDocumentImprovementPrompt,
} from '@/constants/improvement-prompts';

describe('buildSelectionImprovementPrompt', () => {
  it('includes the instruction in the user message', () => {
    const { user } = buildSelectionImprovementPrompt('make it formal', 'hello world', 'en');
    expect(user).toContain('make it formal');
  });

  it('includes the selected text in the user message', () => {
    const { user } = buildSelectionImprovementPrompt('shorten this', 'some long text', 'en');
    expect(user).toContain('some long text');
  });

  it('embeds output language English in the system prompt', () => {
    const { system } = buildSelectionImprovementPrompt('fix it', 'text', 'en');
    expect(system).toContain('English');
  });

  it('embeds output language Italian in the system prompt', () => {
    const { system } = buildSelectionImprovementPrompt('fix it', 'text', 'it');
    expect(system).toContain('Italian');
  });

  it('system prompt instructs to return ONLY the rewritten text', () => {
    const { system } = buildSelectionImprovementPrompt('fix it', 'text', 'en');
    expect(system.toLowerCase()).toContain('only');
    expect(system).toContain('rewritten text');
  });
});

describe('buildDocumentImprovementPrompt', () => {
  it('includes the instruction in the user message', () => {
    const { user } = buildDocumentImprovementPrompt('improve clarity', '# Doc\n\nContent', 'en');
    expect(user).toContain('improve clarity');
  });

  it('includes the full document in the user message', () => {
    const { user } = buildDocumentImprovementPrompt('shorten', '# Title\n\nBody text', 'it');
    expect(user).toContain('# Title\n\nBody text');
  });

  it('embeds output language in system prompt (English)', () => {
    const { system } = buildDocumentImprovementPrompt('fix', 'doc', 'en');
    expect(system).toContain('English');
  });

  it('embeds output language in system prompt (Italian)', () => {
    const { system } = buildDocumentImprovementPrompt('fix', 'doc', 'it');
    expect(system).toContain('Italian');
  });
});
