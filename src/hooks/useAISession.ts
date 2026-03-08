import { useCallback, useRef } from 'react';
import { useLanguageStore } from './useLanguageStore';
import { useDocumentationStore } from './useDocumentationStore';
import { useTemplateStore } from './useTemplateStore';
import { generateDocumentation } from '@/features/ai-integration/ai-manager.service';
import { sessionRepository } from '@/utils/repositories';
import { AINotConfiguredError } from '@/types/ai';

/**
 * Orchestrates an AI documentation session:
 * 1. Resets doc state
 * 2. Streams AI-generated documentation from a transcription
 * 3. Persists the completed session to IndexedDB
 * 4. Handles errors
 *
 * Returns a stable `generate` callback and an `abort` to cancel in-flight generation.
 */
export const useAISession = () => {
  const { speakingLanguage, outputLanguage } = useLanguageStore();
  const { selectedFormat, appendRawResponse, setGenerating, setError, setSavedToHistory, setLastSavedSessionId, reset } =
    useDocumentationStore();
  const { selectedTemplateId } = useTemplateStore();

  // Track whether a generation was aborted so we skip the save step
  const abortedRef = useRef(false);

  const generate = useCallback(
    async (transcription: string) => {
      abortedRef.current = false;
      reset();
      setGenerating(true);

      let backend: 'gemini-nano' | 'external-api' = 'external-api';

      try {
        for await (const { chunk, backend: b } of generateDocumentation(
          transcription,
          speakingLanguage,
          outputLanguage,
          selectedTemplateId,
        )) {
          if (abortedRef.current) break;
          backend = b as 'gemini-nano' | 'external-api';
          appendRawResponse(chunk);
        }

        if (!abortedRef.current) {
          const fullDoc = useDocumentationStore.getState().rawAIResponse;
          const saved = await sessionRepository.save({
            speakingLanguage,
            outputLanguage,
            transcription,
            generatedDoc: fullDoc,
            format: selectedFormat,
            aiBackend: backend,
            createdAt: new Date(),
          });
          setSavedToHistory(true);
          setLastSavedSessionId(saved.id ?? null);
        }
      } catch (err) {
        if (err instanceof AINotConfiguredError) {
          setError(err.message);
        } else {
          setError(err instanceof Error ? err.message : 'Generation failed');
        }
      } finally {
        setGenerating(false);
      }
    },
    [speakingLanguage, outputLanguage, selectedFormat, selectedTemplateId, appendRawResponse, reset, setGenerating, setError, setSavedToHistory, setLastSavedSessionId],
  );

  const abort = useCallback(() => {
    abortedRef.current = true;
  }, []);

  return { generate, abort };
};
