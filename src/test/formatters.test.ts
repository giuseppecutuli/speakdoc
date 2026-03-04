import { describe, it, expect } from 'vitest';
import { toMarkdown } from '@/features/documentation-generation/formatters/markdown.formatter';
import { toWikiMarkup } from '@/features/documentation-generation/formatters/wiki.formatter';
import { toHTML } from '@/features/documentation-generation/formatters/html.formatter';

describe('markdown formatter', () => {
  it('passes through text unchanged (trimmed)', () => {
    expect(toMarkdown('  # Hello  ')).toBe('# Hello');
  });

  it('returns empty string for empty input', () => {
    expect(toMarkdown('')).toBe('');
  });
});

describe('wiki formatter', () => {
  it('converts # headings to h1.', () => {
    expect(toWikiMarkup('# Title')).toBe('h1. Title');
  });

  it('converts ## headings to h2.', () => {
    expect(toWikiMarkup('## Summary')).toBe('h2. Summary');
  });

  it('converts - bullets to *', () => {
    expect(toWikiMarkup('- item')).toBe('* item');
  });

  it('converts **bold** to *bold*', () => {
    expect(toWikiMarkup('**bold**')).toBe('*bold*');
  });

  it('converts `inline code` to {{inline code}}', () => {
    expect(toWikiMarkup('`code`')).toBe('{{code}}');
  });

  it('handles empty input', () => {
    expect(toWikiMarkup('')).toBe('');
  });

  it('handles full document', () => {
    const md = `# Title\n## Summary\n- point one\n**bold text**`;
    const wiki = toWikiMarkup(md);
    expect(wiki).toContain('h1. Title');
    expect(wiki).toContain('h2. Summary');
    expect(wiki).toContain('* point one');
    expect(wiki).toContain('*bold text*');
  });
});

describe('html formatter', () => {
  it('converts # heading to <h1>', () => {
    const html = toHTML('# Hello');
    expect(html).toContain('<h1>');
    expect(html).toContain('Hello');
  });

  it('converts - list to <ul><li>', () => {
    const html = toHTML('- item one\n- item two');
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>');
  });

  it('handles empty input', () => {
    const html = toHTML('');
    expect(typeof html).toBe('string');
  });
});
