export type RecordingStatus = 'idle' | 'recording' | 'paused' | 'processing' | 'done';

export interface TranscriptionResult {
  transcript: string;
  isFinal: boolean;
}
