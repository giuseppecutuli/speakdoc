import { audioBlobDownloadExtension } from '@/utils/audio-blob-extension';

/** Default filename for “Download audio” on a fresh recording. */
export function buildLocalRecordingDownloadFilename(blob: Blob, now = new Date()): string {
  const ext = audioBlobDownloadExtension(blob);
  const stamp = now.toISOString().replaceAll(/[:.]/g, '-').slice(0, 19);
  return `recording-${stamp}.${ext}`;
}
