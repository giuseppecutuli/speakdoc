# Agent: AI Integration Developer

## Role
Gemini Nano browser API, OpenAI-compatible external API, prompt engineering, and the AI fallback pipeline.

## Key Files
`src/features/ai-integration/` — gemini-nano.service.ts, external-api.service.ts, ai-manager.service.ts, prompt-builder.service.ts, AIProvider.tsx
`src/constants/prompts.ts` — 4 system prompts
`src/components/Settings.tsx` — API config UI

## Gemini Nano
```typescript
// Detection
const status = await window.ai?.languageModel?.canCreateTextSession();
// 'readily' | 'after-download' | 'no' | undefined

// Streaming
const session = await window.ai.languageModel.createTextSession({ systemPrompt });
for await (const chunk of session.promptStreaming(text)) { yield chunk; }
session.destroy();
```

## External API (OpenAI-compatible)
```typescript
await fetch(`${endpoint}/chat/completions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(key && { Authorization: `Bearer ${key}` }) },
  body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: text }], stream: true }),
});
// Parse SSE lines: "data: {...}" → extract delta.content, stop on "data: [DONE]"
```

## Fallback Orchestrator
```typescript
// Try Nano → Try external → Throw AINotConfiguredError
async function* generate(text: string, pair: LanguagePair): AsyncGenerator<string> {
  const prompt = buildSystemPrompt(pair);
  if (await GeminiNanoService.isAvailable()) { yield* GeminiNanoService.generate(prompt, text); return; }
  if (ExternalAPIService.isConfigured()) { yield* ExternalAPIService.generate(prompt, text); return; }
  throw new AINotConfiguredError('No AI backend. Enable Gemini Nano or configure API in Settings.');
}
```

## System Prompts (4 language pairs)
```typescript
// src/constants/prompts.ts
export const SYSTEM_PROMPTS = {
  'it→en': `You are a technical documentation expert. Translate and restructure the Italian speech into professional English documentation. Format: ## Title, ## Summary, ## Key Points, ## Action Items. Output: ENGLISH ONLY.`,
  'en→en': `You are a technical documentation expert. Create professional English documentation from the transcription. Format: ## Title, ## Summary, ## Key Points, ## Action Items.`,
  'en→it': `Sei un esperto di documentazione tecnica. Crea documentazione italiana professionale dalla trascrizione inglese. Formato: ## Titolo, ## Riepilogo, ## Punti chiave, ## Azioni. Output: SOLO ITALIANO.`,
  'it→it': `Sei un esperto di documentazione tecnica. Crea documentazione italiana professionale dalla trascrizione. Formato: ## Titolo, ## Riepilogo, ## Punti chiave, ## Azioni.`,
};
export const buildSystemPrompt = (s: string, o: string) => SYSTEM_PROMPTS[`${s}→${o}`] ?? SYSTEM_PROMPTS['en→en'];
```

## Config (localStorage only)
```typescript
interface AIConfig { apiEndpoint: string; apiKey: string; model: string; }
// Defaults: endpoint='http://localhost:1234/v1', key='', model='local-model'
```

## Test Mocks
```typescript
// Gemini Nano
vi.stubGlobal('ai', { languageModel: { canCreateTextSession: vi.fn().mockResolvedValue('readily'),
  createTextSession: vi.fn().mockResolvedValue({ promptStreaming: vi.fn().mockReturnValue((async function*() { yield '# Test'; })()),  destroy: vi.fn() }) } });

// External API with MSW
http.post('http://localhost:1234/v1/chat/completions', () =>
  HttpResponse.text('data: {"choices":[{"delta":{"content":"# Doc"}}]}\ndata: [DONE]\n'));
```

## Checklist
- [ ] Gemini Nano detection tested (available / not available)
- [ ] External API streaming tested with MSW
- [ ] Fallback chain tested (Nano unavailable → external used)
- [ ] All 4 prompts exist and tested
- [ ] AINotConfiguredError thrown when both unavailable
- [ ] API key never logged
- [ ] Settings persists to localStorage
- [ ] Coverage ≥ 80%
