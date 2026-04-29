export type AIBackend = 'gemini-nano' | 'external-api' | 'none';

/** Persisted `aiBackend` on saved sessions after a successful run (never `none`). */
export type DocumentationAiBackend = Exclude<AIBackend, 'none'>;

export interface AIConfig {
  apiEndpoint: string;
  apiKey: string;
  model: string;
}

export interface GenerationOptions {
  systemPrompt: string;
  userMessage: string;
}

export class AINotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AINotConfiguredError';
  }
}
