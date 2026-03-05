import { createAudioUrl, revokeAudioUrl } from '@/utils/audio-url';

/**
 * Downloads an audio blob as a .webm file.
 * The caller supplies the filename; this service handles URL lifecycle.
 */
export const downloadAudioBlob = (blob: Blob, filename: string): void => {
  const url = createAudioUrl(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
  } finally {
    revokeAudioUrl(url);
  }
};

/** Returns a filename like `recording-2026-03-05-1430.webm`. */
export const buildAudioFilename = (date: Date = new Date()): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `recording-${yyyy}-${mm}-${dd}-${hh}${min}.webm`;
};
