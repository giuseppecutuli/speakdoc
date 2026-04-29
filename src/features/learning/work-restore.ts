import type { DocumentationSession, SessionDraft } from '@/types/session';
import { coerceLanguageCode, type LanguageCode } from '@/types/language';
import { coerceOutputFormat, type OutputFormat } from '@/types/documentation';
import { getStoredAudioBlob } from '@/utils/audio-chunk-storage';

/** Normalized slice of persisted work (session or draft) for replay into UI stores. */
export type WorkRestoreSnapshot = {
  speakingLanguage: LanguageCode;
  outputLanguage: LanguageCode;
  transcription: string;
  generatedDoc: string;
  format: OutputFormat;
  audio: Blob | null;
};

export function buildWorkRestoreSnapshot(
  source: DocumentationSession | SessionDraft,
): WorkRestoreSnapshot {
  return {
    speakingLanguage: coerceLanguageCode(String(source.speakingLanguage)),
    outputLanguage: coerceLanguageCode(String(source.outputLanguage)),
    transcription: source.transcription,
    generatedDoc: source.generatedDoc,
    format: coerceOutputFormat(String(source.format)),
    audio: getStoredAudioBlob(source),
  };
}

export type ApplyWorkRestoreDeps = {
  setLanguages: (speaking: LanguageCode, output: LanguageCode) => void;
  setTranscription: (text: string) => void;
  setAudioBlob: (blob: Blob | null) => void;
  setFormat: (format: OutputFormat) => void;
  setFormattedOutput: (doc: string) => void;
};

/** Writes snapshot into recording + documentation language/format stores. */
export function applyWorkRestoreSnapshot(
  snapshot: WorkRestoreSnapshot,
  deps: ApplyWorkRestoreDeps,
): void {
  deps.setLanguages(snapshot.speakingLanguage, snapshot.outputLanguage);
  deps.setTranscription(snapshot.transcription);
  deps.setAudioBlob(snapshot.audio);
  deps.setFormat(snapshot.format);
  deps.setFormattedOutput(snapshot.generatedDoc);
}
