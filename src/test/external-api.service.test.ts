import { describe, it, expect, beforeEach } from 'vitest';
import { isExternalAPIConfigured, loadAIConfig } from '@/features/ai-integration/external-api.service';
import { STORAGE_KEYS, DEFAULT_API_ENDPOINT, DEFAULT_MODEL } from '@/constants/config';

describe('isExternalAPIConfigured', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns false when no endpoint saved (default fallback does not count)', () => {
    expect(isExternalAPIConfigured()).toBe(false);
  });

  it('returns true when user has explicitly saved an endpoint', () => {
    localStorage.setItem(STORAGE_KEYS.API_ENDPOINT, 'http://localhost:1234/v1');
    expect(isExternalAPIConfigured()).toBe(true);
  });

  it('returns false when saved endpoint is empty string', () => {
    localStorage.setItem(STORAGE_KEYS.API_ENDPOINT, '');
    expect(isExternalAPIConfigured()).toBe(false);
  });
});

describe('loadAIConfig', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaults when nothing is saved', () => {
    const config = loadAIConfig();
    expect(config.apiEndpoint).toBe(DEFAULT_API_ENDPOINT);
    expect(config.apiKey).toBe('');
    expect(config.model).toBe(DEFAULT_MODEL);
  });

  it('returns saved values when present', () => {
    localStorage.setItem(STORAGE_KEYS.API_ENDPOINT, 'https://api.openai.com/v1');
    localStorage.setItem(STORAGE_KEYS.API_KEY, 'sk-test');
    localStorage.setItem(STORAGE_KEYS.MODEL, 'gpt-4o');
    const config = loadAIConfig();
    expect(config.apiEndpoint).toBe('https://api.openai.com/v1');
    expect(config.apiKey).toBe('sk-test');
    expect(config.model).toBe('gpt-4o');
  });
});
