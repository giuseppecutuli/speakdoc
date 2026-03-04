import { describe, it, expect } from 'vitest';
import { applyFormat } from '@/features/documentation-generation/doc-generator.service';

const RAW_MARKDOWN = `# Meeting Notes\n\n## Action Items\n\n- Follow up with team\n- Send report\n\n**Deadline:** Friday`;

describe('applyFormat — markdown', () => {
  it('returns trimmed markdown unchanged', () => {
    const result = applyFormat(RAW_MARKDOWN, 'markdown');
    expect(result).toBe(RAW_MARKDOWN.trim());
  });

  it('trims surrounding whitespace', () => {
    expect(applyFormat('  # Title  ', 'markdown')).toBe('# Title');
  });
});

describe('applyFormat — wiki', () => {
  it('converts headings to Confluence wiki syntax', () => {
    const result = applyFormat(RAW_MARKDOWN, 'wiki');
    expect(result).toContain('h1. Meeting Notes');
    expect(result).toContain('h2. Action Items');
  });

  it('converts bullet points', () => {
    const result = applyFormat(RAW_MARKDOWN, 'wiki');
    expect(result).toContain('* Follow up with team');
    expect(result).toContain('* Send report');
  });

  it('converts bold text', () => {
    const result = applyFormat(RAW_MARKDOWN, 'wiki');
    expect(result).toContain('*Deadline:*');
  });
});

describe('applyFormat — html', () => {
  it('produces HTML with heading tags', () => {
    const result = applyFormat(RAW_MARKDOWN, 'html');
    expect(result).toContain('<h1');
    expect(result).toContain('Meeting Notes');
  });

  it('produces HTML with list tags', () => {
    const result = applyFormat(RAW_MARKDOWN, 'html');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>');
  });

  it('returns a string for empty input', () => {
    const result = applyFormat('', 'html');
    expect(typeof result).toBe('string');
  });
});

describe('applyFormat — integration pipeline (transcription → format)', () => {
  it('produces different output for each format from the same input', () => {
    const input = '# Title\n- item';
    const md = applyFormat(input, 'markdown');
    const wiki = applyFormat(input, 'wiki');
    const html = applyFormat(input, 'html');
    // All three should differ
    expect(md).not.toBe(wiki);
    expect(md).not.toBe(html);
    expect(wiki).not.toBe(html);
  });

  it('wiki output does not contain # markdown headings', () => {
    const result = applyFormat('# Title', 'wiki');
    expect(result).not.toMatch(/^# /);
    expect(result).toContain('h1.');
  });

  it('html output contains HTML tags', () => {
    const result = applyFormat('# Title', 'html');
    expect(result).toMatch(/<[a-z]+/);
  });
});
