// Gemini Nano uses the Chrome built-in window.ai API
// https://developer.chrome.com/docs/ai/built-in

interface WindowAI {
  languageModel: {
    availability: () => Promise<string>;
    create: (options: { systemPrompt: string }) => Promise<{
      promptStreaming: (text: string) => AsyncIterable<string>;
      destroy: () => void;
    }>;
  };
}

const getWindowAI = (): WindowAI | null => {
  const w = window as unknown as { ai?: WindowAI };
  return w.ai ?? null;
};

export const isGeminiNanoAvailable = async (): Promise<boolean> => {
  const ai = getWindowAI();
  if (!ai?.languageModel) return false;
  try {
    const status = await ai.languageModel.availability();
    return status === 'available' || status === 'downloading';
  } catch {
    return false;
  }
};

export async function* generateWithGeminiNano(
  systemPrompt: string,
  userMessage: string,
): AsyncGenerator<string> {
  const ai = getWindowAI();
  if (!ai?.languageModel) throw new Error('Gemini Nano not available');

  const session = await ai.languageModel.create({ systemPrompt });
  try {
    const stream = session.promptStreaming(userMessage);
    let previousLength = 0;
    for await (const chunk of stream) {
      // window.ai streams cumulative text — yield only the new part
      const newText = chunk.slice(previousLength);
      previousLength = chunk.length;
      if (newText) yield newText;
    }
  } finally {
    session.destroy();
  }
}
