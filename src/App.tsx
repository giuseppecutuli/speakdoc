import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { LanguageSelectionModal } from '@/features/language-selection/LanguageSelectionModal';
import { VoiceRecorder } from '@/features/voice-input/VoiceRecorder';
import { TranscriptionDisplay } from '@/features/transcription/TranscriptionDisplay';
import { DocumentationEditor } from '@/features/documentation-generation/DocumentationEditor';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';
import { generateDocumentation } from '@/features/ai-integration/ai-manager.service';
import { sessionRepository } from '@/utils/repositories';
import { AINotConfiguredError } from '@/types/ai';

export const App = () => {
  const [showLanguageModal, setShowLanguageModal] = useState(true);
  const { speakingLanguage, outputLanguage, loadFromStorage, unlockSession } = useLanguageStore();
  const {
    rawAIResponse,
    selectedFormat,
    setGenerating,
    appendRawResponse,
    setError,
    reset: resetDoc,
  } = useDocumentationStore();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const handleLanguageConfirm = () => {
    setShowLanguageModal(false);
  };

  const handleTranscriptionComplete = useCallback(
    async (transcription: string) => {
      resetDoc();
      setGenerating(true);

      let backend: 'gemini-nano' | 'external-api' = 'external-api';

      try {
        for await (const { chunk, backend: b } of generateDocumentation(
          transcription,
          speakingLanguage,
          outputLanguage,
        )) {
          backend = b as 'gemini-nano' | 'external-api';
          appendRawResponse(chunk);
        }

        const fullDoc = useDocumentationStore.getState().rawAIResponse;
        await sessionRepository.save({
          speakingLanguage,
          outputLanguage,
          transcription,
          generatedDoc: fullDoc,
          format: selectedFormat,
          aiBackend: backend,
          createdAt: new Date(),
        });
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
    [speakingLanguage, outputLanguage, selectedFormat, appendRawResponse, resetDoc, setGenerating, setError],
  );

  const handleRegenerate = useCallback(() => {
    unlockSession();
    setShowLanguageModal(true);
    resetDoc();
  }, [unlockSession, resetDoc]);

  const { error: docError } = useDocumentationStore();

  // Suppress unused warning — rawAIResponse used via store subscription in DocumentationEditor
  void rawAIResponse;

  return (
    <Layout>
      <LanguageSelectionModal open={showLanguageModal} onConfirm={handleLanguageConfirm} />

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Voice Recording</h2>
            <button
              onClick={() => setShowLanguageModal(true)}
              className="text-xs text-indigo-600 hover:underline"
            >
              Change languages
            </button>
          </div>
          <VoiceRecorder onTranscriptionComplete={handleTranscriptionComplete} />
        </div>

        <TranscriptionDisplay />

        {docError && (
          <div
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            role="alert"
          >
            <strong>Error:</strong> {docError}
          </div>
        )}

        <DocumentationEditor onRegenerate={handleRegenerate} />
      </div>
    </Layout>
  );
};

export default App;
