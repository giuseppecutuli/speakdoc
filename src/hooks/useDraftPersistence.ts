import { useEffect, useRef } from 'react';
import { useRecordingStore } from '@/hooks/useRecordingStore';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { draftRepository } from '@/utils/repositories';
import { AUDIO_BLOB_MAX_BYTES } from '@/constants/draft-limits';

const DRAFT_DEBOUNCE_MS = 1000;

export const useDraftPersistence = () => {
  const transcription = useRecordingStore((s) => s.transcription);
  const audioBlob = useRecordingStore((s) => s.audioBlob);
  const formattedOutput = useDocumentationStore((s) => s.formattedOutput);
  const selectedFormat = useDocumentationStore((s) => s.selectedFormat);
  const speakingLanguage = useLanguageStore((s) => s.speakingLanguage);
  const outputLanguage = useLanguageStore((s) => s.outputLanguage);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Skip saving when both transcription and generatedDoc are empty
    if (!transcription && !formattedOutput) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      const safeAudioBlob =
        audioBlob && audioBlob.size <= AUDIO_BLOB_MAX_BYTES ? audioBlob : undefined;

      draftRepository
        .save({
          transcription,
          generatedDoc: formattedOutput,
          format: selectedFormat,
          speakingLanguage,
          outputLanguage,
          audioBlob: safeAudioBlob,
          savedAt: new Date(),
        })
        .catch(() => undefined); // non-critical, silent
    }, DRAFT_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [transcription, formattedOutput, selectedFormat, speakingLanguage, outputLanguage, audioBlob]);
};
