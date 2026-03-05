export const DEFAULT_API_ENDPOINT = 'http://localhost:1234/v1';
export const DEFAULT_MODEL = 'local-model';

export const STORAGE_KEYS = {
  SPEAKING_LANGUAGE: 'speak-doc:speaking-lang',
  OUTPUT_LANGUAGE: 'speak-doc:output-lang',
  API_ENDPOINT: 'speak-doc:api-endpoint',
  API_KEY: 'speak-doc:api-key',
  MODEL: 'speak-doc:model',
  SPEECH_PROVIDER: 'speak-doc:speech-provider',
  WHISPER_MODEL_SIZE: 'speak-doc:whisper-model-size',
} as const;

export const MIN_SESSIONS_FOR_SUGGESTIONS = 5;
export const SESSION_RETENTION_DAYS = 90;
