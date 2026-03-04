import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// window.ai mock helpers
// ---------------------------------------------------------------------------

interface MockSession {
  promptStreaming: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
}

const makeMockSession = (chunks: string[]): MockSession => {
  // window.ai streams *cumulative* text — each chunk is the full string so far
  const cumulative = chunks.map((_, i) => chunks.slice(0, i + 1).join(''));

  const promptStreaming = vi.fn(async function* () {
    for (const c of cumulative) yield c;
  });

  return { promptStreaming, destroy: vi.fn() };
};

const mockWindowAI = (availability: string, session: MockSession) => {
  const ai = {
    languageModel: {
      availability: vi.fn().mockResolvedValue(availability),
      create: vi.fn().mockResolvedValue(session),
    },
  };
  Object.defineProperty(window, 'ai', { value: ai, writable: true, configurable: true });
  return ai;
};

const clearWindowAI = () => {
  Object.defineProperty(window, 'ai', { value: undefined, writable: true, configurable: true });
};

// ---------------------------------------------------------------------------
// Import after mock setup so each test controls window.ai
// ---------------------------------------------------------------------------

import { isGeminiNanoAvailable, generateWithGeminiNano } from '@/features/ai-integration/gemini-nano.service';

describe('isGeminiNanoAvailable', () => {
  beforeEach(clearWindowAI);

  it('returns false when window.ai is absent', async () => {
    expect(await isGeminiNanoAvailable()).toBe(false);
  });

  it('returns true when availability is "available"', async () => {
    mockWindowAI('available', makeMockSession([]));
    expect(await isGeminiNanoAvailable()).toBe(true);
  });

  it('returns true when availability is "downloading"', async () => {
    mockWindowAI('downloading', makeMockSession([]));
    expect(await isGeminiNanoAvailable()).toBe(true);
  });

  it('returns false when availability is "unavailable"', async () => {
    mockWindowAI('unavailable', makeMockSession([]));
    expect(await isGeminiNanoAvailable()).toBe(false);
  });

  it('returns false when availability() throws', async () => {
    Object.defineProperty(window, 'ai', {
      value: {
        languageModel: {
          availability: vi.fn().mockRejectedValue(new Error('not supported')),
        },
      },
      writable: true,
      configurable: true,
    });
    expect(await isGeminiNanoAvailable()).toBe(false);
  });
});

describe('generateWithGeminiNano', () => {
  beforeEach(clearWindowAI);

  it('throws when window.ai is absent', async () => {
    const gen = generateWithGeminiNano('system', 'user text');
    await expect(gen.next()).rejects.toThrow('Gemini Nano not available');
  });

  it('yields incremental chunks (strips cumulative prefix)', async () => {
    const session = makeMockSession(['Hello', ' world', '!']);
    mockWindowAI('available', session);

    const chunks: string[] = [];
    for await (const chunk of generateWithGeminiNano('system', 'hi')) {
      chunks.push(chunk);
    }
    expect(chunks).toEqual(['Hello', ' world', '!']);
  });

  it('calls session.destroy() even on success', async () => {
    const session = makeMockSession(['ok']);
    mockWindowAI('available', session);

    // consume generator
    for await (const _ of generateWithGeminiNano('sys', 'msg')) {
      // noop
    }
    expect(session.destroy).toHaveBeenCalledOnce();
  });

  it('calls session.destroy() on error', async () => {
    const session: MockSession = {
      promptStreaming: vi.fn(async function* () {
        throw new Error('crash');
      }),
      destroy: vi.fn(),
    };
    mockWindowAI('available', session);

    const gen = generateWithGeminiNano('sys', 'msg');
    await expect(gen.next()).rejects.toThrow('crash');
    expect(session.destroy).toHaveBeenCalledOnce();
  });

  it('passes systemPrompt to languageModel.create', async () => {
    const session = makeMockSession(['response']);
    const ai = mockWindowAI('available', session);

    for await (const _ of generateWithGeminiNano('my system prompt', 'user msg')) {
      // noop
    }
    expect(ai.languageModel.create).toHaveBeenCalledWith({ systemPrompt: 'my system prompt' });
  });

  it('skips empty delta chunks', async () => {
    // Simulate cumulative stream where two consecutive values are identical (no new text)
    const session: MockSession = {
      promptStreaming: vi.fn(async function* () {
        yield 'Hello';
        yield 'Hello'; // same as previous — should produce empty delta and be skipped
        yield 'Hello world';
      }),
      destroy: vi.fn(),
    };
    mockWindowAI('available', session);

    const chunks: string[] = [];
    for await (const chunk of generateWithGeminiNano('sys', 'msg')) {
      chunks.push(chunk);
    }
    expect(chunks).toEqual(['Hello', ' world']);
  });
});
