import type { OutputFormat } from '@/types/documentation';
import { toMarkdown } from './formatters/markdown.formatter';
import { toWikiMarkup } from './formatters/wiki.formatter';
import { toHTML } from './formatters/html.formatter';

export const applyFormat = (rawText: string, format: OutputFormat): string => {
  switch (format) {
    case 'markdown':
      return toMarkdown(rawText);
    case 'wiki':
      return toWikiMarkup(rawText);
    case 'html':
      return toHTML(rawText);
  }
};
