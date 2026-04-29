import type { DocumentationSession } from '@/types/session';

/** Session JSON shape for export (blobs are omitted — not JSON-serializable). */
export type DocumentationSessionExportRow = Omit<
  DocumentationSession,
  'audioBlob' | 'audioChunks' | 'audioMimeType'
>;

export function stripSessionAudioForExport(session: DocumentationSession): DocumentationSessionExportRow {
  const row = { ...session };
  delete row.audioBlob;
  delete row.audioChunks;
  delete row.audioMimeType;
  return row;
}
