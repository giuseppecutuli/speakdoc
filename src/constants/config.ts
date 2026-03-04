export const DEFAULT_API_ENDPOINT = 'http://localhost:1234/v1';
export const DEFAULT_MODEL = 'local-model';

export const STORAGE_KEYS = {
  SPEAKING_LANGUAGE: 'doc-assistant:speaking-lang',
  OUTPUT_LANGUAGE: 'doc-assistant:output-lang',
  API_ENDPOINT: 'doc-assistant:api-endpoint',
  API_KEY: 'doc-assistant:api-key',
  MODEL: 'doc-assistant:model',
} as const;

export const MIN_SESSIONS_FOR_SUGGESTIONS = 5;
export const SESSION_RETENTION_DAYS = 90;
