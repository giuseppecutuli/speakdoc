export type AudioBlobDownloadExtension = 'webm' | 'audio';

/** File extension for a downloaded mic/file blob (WebM vs generic). */
export function audioBlobDownloadExtension(blob: Blob): AudioBlobDownloadExtension {
  return blob.type.includes('webm') ? 'webm' : 'audio';
}
