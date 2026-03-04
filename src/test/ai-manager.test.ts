import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the services before importing the manager
vi.mock('@/features/ai-integration/gemini-nano.service', () => ({
  isGeminiNanoAvailable: vi.fn(),
  generateWithGeminiNano: vi.fn(),
}));

vi.mock('@/features/ai-integration/external-api.service', () => ({
  isExternalAPIConfigured: vi.fn(),
  generateWithExternalAPI: vi.fn(),
  loadAIConfig: vi.fn(() => ({ apiEndpoint: 'http://localhost:1234/v1', apiKey: '', model: 'test' })),
  saveAIConfig: vi.fn(),
}));

import { generateDocumentation, detectActiveBackend } from '@/features/ai-integration/ai-manager.service';
import * as gemini from '@/features/ai-integration/gemini-nano.service';
import * as externalApi from '@/features/ai-integration/external-api.service';
import { AINotConfiguredError } from '@/types/ai';

async function* makeGenerator(values: string[]) {
  for (const v of values) yield v;
}

describe('detectActiveBackend', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns gemini-nano when available', async () => {
    vi.mocked(gemini.isGeminiNanoAvailable).mockResolvedValue(true);
    expect(await detectActiveBackend()).toBe('gemini-nano');
  });

  it('returns external-api when Gemini unavailable but API configured', async () => {
    vi.mocked(gemini.isGeminiNanoAvailable).mockResolvedValue(false);
    vi.mocked(externalApi.isExternalAPIConfigured).mockReturnValue(true);
    expect(await detectActiveBackend()).toBe('external-api');
  });

  it('returns none when nothing available', async () => {
    vi.mocked(gemini.isGeminiNanoAvailable).mockResolvedValue(false);
    vi.mocked(externalApi.isExternalAPIConfigured).mockReturnValue(false);
    expect(await detectActiveBackend()).toBe('none');
  });
});

describe('generateDocumentation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses Gemini Nano when available', async () => {
    vi.mocked(gemini.isGeminiNanoAvailable).mockResolvedValue(true);
    vi.mocked(gemini.generateWithGeminiNano).mockReturnValue(makeGenerator(['hello ', 'world']));

    const chunks: string[] = [];
    for await (const { chunk, backend } of generateDocumentation('test', 'it', 'en')) {
      chunks.push(chunk);
      expect(backend).toBe('gemini-nano');
    }
    expect(chunks).toEqual(['hello ', 'world']);
  });

  it('falls back to external API when Gemini unavailable', async () => {
    vi.mocked(gemini.isGeminiNanoAvailable).mockResolvedValue(false);
    vi.mocked(externalApi.isExternalAPIConfigured).mockReturnValue(true);
    vi.mocked(externalApi.generateWithExternalAPI).mockReturnValue(makeGenerator(['doc text']));

    const chunks: string[] = [];
    for await (const { chunk, backend } of generateDocumentation('test', 'en', 'en')) {
      chunks.push(chunk);
      expect(backend).toBe('external-api');
    }
    expect(chunks).toEqual(['doc text']);
  });

  it('throws AINotConfiguredError when nothing available', async () => {
    vi.mocked(gemini.isGeminiNanoAvailable).mockResolvedValue(false);
    vi.mocked(externalApi.isExternalAPIConfigured).mockReturnValue(false);

    const gen = generateDocumentation('test', 'it', 'en');
    await expect(gen.next()).rejects.toThrow(AINotConfiguredError);
  });
});
