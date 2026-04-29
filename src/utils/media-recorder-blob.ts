/**
 * Stops a {@link MediaRecorder} and builds one {@link Blob} from collected chunks (no re-encoding).
 */
export function finalizeMediaRecorderBlob(
  mediaRecorder: MediaRecorder,
  chunks: Blob[],
): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (mediaRecorder.state === 'inactive') {
      const blob =
        chunks.length > 0 ? new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' }) : null;
      resolve(blob);
      return;
    }
    mediaRecorder.onstop = () => {
      const blob =
        chunks.length > 0 ? new Blob(chunks, { type: mediaRecorder.mimeType || 'audio/webm' }) : null;
      resolve(blob);
    };
    mediaRecorder.stop();
  });
}
