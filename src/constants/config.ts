export const DEFAULT_API_ENDPOINT = 'http://localhost:1234/v1';
export const DEFAULT_MODEL = 'local-model';

export const STORAGE_KEYS = {
  SPEAKING_LANGUAGE: 'speak-doc:speaking-lang',
  OUTPUT_LANGUAGE: 'speak-doc:output-lang',
  API_ENDPOINT: 'speak-doc:api-endpoint',
  API_KEY: 'speak-doc:api-key',
  MODEL: 'speak-doc:model',
  SPEECH_PROVIDER: 'speak-doc:speech-provider',
  /** Active draft row id in IndexedDB for debounced autosave (see IndexedDBDraftRepository). */
  ACTIVE_DRAFT_ID: 'speak-doc:active-draft-id',
  ASSEMBLYAI_API_KEY: 'speak-doc:assemblyai-api-key',
  ASSEMBLYAI_MODEL: 'speak-doc:assemblyai-model',
  DOC_TEMPLATE: 'speak-doc:doc-template',
} as const;

export const MIN_SESSIONS_FOR_SUGGESTIONS = 5;
export const SESSION_RETENTION_DAYS = 90;
