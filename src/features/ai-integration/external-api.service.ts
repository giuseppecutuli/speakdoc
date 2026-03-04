import { STORAGE_KEYS, DEFAULT_API_ENDPOINT, DEFAULT_MODEL } from '@/constants/config';
import type { AIConfig } from '@/types/ai';

export const loadAIConfig = (): AIConfig => ({
  apiEndpoint: localStorage.getItem(STORAGE_KEYS.API_ENDPOINT) ?? DEFAULT_API_ENDPOINT,
  apiKey: localStorage.getItem(STORAGE_KEYS.API_KEY) ?? '',
  model: localStorage.getItem(STORAGE_KEYS.MODEL) ?? DEFAULT_MODEL,
});

export const saveAIConfig = (config: Partial<AIConfig>): void => {
  if (config.apiEndpoint !== undefined)
    localStorage.setItem(STORAGE_KEYS.API_ENDPOINT, config.apiEndpoint);
  if (config.apiKey !== undefined)
    localStorage.setItem(STORAGE_KEYS.API_KEY, config.apiKey);
  if (config.model !== undefined)
    localStorage.setItem(STORAGE_KEYS.MODEL, config.model);
};

export const isExternalAPIConfigured = (): boolean => {
  // Only considered configured if the user has explicitly saved an endpoint.
  // Falling back to the default constant does not count as configured.
  const saved = localStorage.getItem(STORAGE_KEYS.API_ENDPOINT);
  return saved !== null && saved.length > 0;
};

export async function* generateWithExternalAPI(
  systemPrompt: string,
  userMessage: string,
): AsyncGenerator<string> {
  const config = loadAIConfig();

  const response = await fetch(`${config.apiEndpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value).split('\n');
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // skip malformed lines
      }
    }
  }
}
