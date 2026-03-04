import { marked } from 'marked';

export const toHTML = (markdown: string): string => {
  const result = marked.parse(markdown.trim(), { async: false });
  return result as string;
};
