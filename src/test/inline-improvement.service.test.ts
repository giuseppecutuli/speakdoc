import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AINotConfiguredError } from '@/types/ai';

// Mock AI integration modules
vi.mock('@/features/ai-integration/gemini-nano.service', () => ({
  isGeminiNanoAvailable: vi.fn(),
  generateWithGeminiNano: vi.fn(),
}));
vi.mock('@/features/ai-integration/external-api.service', () => ({
  isExternalAPIConfigured: vi.fn(),
  generateWithExternalAPI: vi.fn(),
}));

import {
  isGeminiNanoAvailable,
  generateWithGeminiNano,
} from '@/features/ai-integration/gemini-nano.service';
import {
  isExternalAPIConfigured,
  generateWithExternalAPI,
} from '@/features/ai-integration/external-api.service';
import { improveSelection, improveDocument } from '../features/documentation-generation/inline-improvement.service';

async function collect(gen: AsyncGenerator<string>): Promise<string> {
  let result = '';
  for await (const chunk of gen) result += chunk;
  return result;
}

async function* makeGen(chunks: string[]): AsyncGenerator<string> {
  for (const chunk of chunks) yield chunk;
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('improveSelection', () => {
  it('streams rewritten text via Gemini Nano when available', async () => {
    vi.mocked(isGeminiNanoAvailable).mockResolvedValue(true);
    vi.mocked(generateWithGeminiNano).mockReturnValue(makeGen(['formal ', 'text']));

    const result = await collect(improveSelection('hello', 'make formal', 'en'));
    expect(result).toBe('formal text');
    expect(generateWithGeminiNano).toHaveBeenCalledOnce();
  });

  it('falls back to external API when Gemini Nano is unavailable', async () => {
    vi.mocked(isGeminiNanoAvailable).mockResolvedValue(false);
    vi.mocked(isExternalAPIConfigured).mockReturnValue(true);
    vi.mocked(generateWithExternalAPI).mockReturnValue(makeGen(['improved']));

    const result = await collect(improveSelection('hello', 'shorten', 'it'));
    expect(result).toBe('improved');
    expect(generateWithExternalAPI).toHaveBeenCalledOnce();
  });

  it('throws AINotConfiguredError when no backend is available', async () => {
    vi.mocked(isGeminiNanoAvailable).mockResolvedValue(false);
    vi.mocked(isExternalAPIConfigured).mockReturnValue(false);

    await expect(collect(improveSelection('hello', 'fix', 'en'))).rejects.toBeInstanceOf(
      AINotConfiguredError,
    );
  });
});

describe('improveDocument', () => {
  it('streams improved document via Gemini Nano', async () => {
    vi.mocked(isGeminiNanoAvailable).mockResolvedValue(true);
    vi.mocked(generateWithGeminiNano).mockReturnValue(makeGen(['# Title\n', '\nImproved body']));

    const result = await collect(improveDocument('# Title\n\nBody', 'improve clarity', 'en'));
    expect(result).toBe('# Title\n\nImproved body');
  });

  it('throws AINotConfiguredError when no backend is configured', async () => {
    vi.mocked(isGeminiNanoAvailable).mockResolvedValue(false);
    vi.mocked(isExternalAPIConfigured).mockReturnValue(false);

    await expect(
      collect(improveDocument('# Doc', 'improve', 'it')),
    ).rejects.toBeInstanceOf(AINotConfiguredError);
  });

  it('passes instruction and content to the prompt builders', async () => {
    vi.mocked(isGeminiNanoAvailable).mockResolvedValue(false);
    vi.mocked(isExternalAPIConfigured).mockReturnValue(true);
    vi.mocked(generateWithExternalAPI).mockReturnValue(makeGen(['ok']));

    await collect(improveDocument('# My Doc\n\nContent', 'be concise', 'en'));

    const [systemPrompt, userMessage] = vi.mocked(generateWithExternalAPI).mock.calls[0];
    expect(systemPrompt).toContain('English');
    expect(userMessage).toContain('be concise');
    expect(userMessage).toContain('# My Doc');
  });
});
