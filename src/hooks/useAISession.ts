import { useCallback, useRef } from 'react';
import { useLanguageStore } from './useLanguageStore';
import { useDocumentationStore } from './useDocumentationStore';
import { useTemplateStore } from './useTemplateStore';
import { generateDocumentation } from '@/features/ai-integration/ai-manager.service';
import { sessionRepository, draftRepository } from '@/utils/repositories';
import { STORAGE_KEYS } from '@/constants/config';
import { AINotConfiguredError, type DocumentationAiBackend } from '@/types/ai';
import { useRecordingStore } from '@/hooks/useRecordingStore';
import { buildDefaultSessionName } from '@/utils/session-naming';
import { packAudioForStorage } from '@/utils/audio-chunk-storage';

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

      let backend: DocumentationAiBackend = 'external-api';

      try {
        for await (const { chunk, backend: streamBackend } of generateDocumentation(
          transcription,
          speakingLanguage,
          outputLanguage,
          selectedTemplateId,
        )) {
          if (abortedRef.current) break;
          backend = streamBackend;
          appendRawResponse(chunk);
        }

        if (!abortedRef.current) {
          const fullDoc = useDocumentationStore.getState().rawAIResponse;
          const createdAt = new Date();
          const recordingBlob = useRecordingStore.getState().audioBlob;
          const audioPack = packAudioForStorage(recordingBlob ?? null);
          const saved = await sessionRepository.save({
            name: buildDefaultSessionName(createdAt),
            speakingLanguage,
            outputLanguage,
            transcription,
            generatedDoc: fullDoc,
            format: selectedFormat,
            aiBackend: backend,
            createdAt,
            ...audioPack,
          });
          setSavedToHistory(true);
          setLastSavedSessionId(saved.id ?? null);

          const activeRaw = localStorage.getItem(STORAGE_KEYS.ACTIVE_DRAFT_ID);
          if (activeRaw) {
            const draftId = Number(activeRaw);
            if (!Number.isNaN(draftId)) {
              await draftRepository.delete(draftId).catch(() => undefined);
            }
          }
          draftRepository.beginNewDraft();
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
