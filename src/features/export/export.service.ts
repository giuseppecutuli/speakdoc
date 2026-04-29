import type { OutputFormat } from '@/types/documentation';

const EXTENSION: Record<OutputFormat, string> = {
  markdown: 'md',
  wiki: 'txt',
  html: 'html',
};

const MIME_TYPE: Record<OutputFormat, string> = {
  markdown: 'text/markdown',
  wiki: 'text/plain',
  html: 'text/html',
};

export const copyToClipboard = async (text: string): Promise<void> => {
  await navigator.clipboard.writeText(text);
};

export const downloadAsFile = (
  text: string,
  format: OutputFormat,
  filename = 'documentation',
): void => {
  const ext = EXTENSION[format];
  const mime = MIME_TYPE[format];
  const blob = new Blob([text], { type: mime });
  download_blob(blob, `${filename}.${ext}`);
};

/**
 * Triggers a file download for an arbitrary Blob (e.g. recorded audio).
 */
export const download_blob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};
