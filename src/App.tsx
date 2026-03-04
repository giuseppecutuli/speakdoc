import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { LanguageSelectionModal } from '@/features/language-selection/LanguageSelectionModal';
import { VoiceRecorder } from '@/features/voice-input/VoiceRecorder';
import { TranscriptionDisplay } from '@/features/transcription/TranscriptionDisplay';
import { DocumentationEditor } from '@/features/documentation-generation/DocumentationEditor';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';
import { useAISession } from '@/hooks/useAISession';

export const App = () => {
  const [showLanguageModal, setShowLanguageModal] = useState(true);
  const { loadFromStorage, unlockSession } = useLanguageStore();
  const { error: docError, reset: resetDoc } = useDocumentationStore();
  const { generate } = useAISession();

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  const handleLanguageConfirm = () => {
    setShowLanguageModal(false);
  };

  const handleRegenerate = useCallback(() => {
    unlockSession();
    setShowLanguageModal(true);
    resetDoc();
  }, [unlockSession, resetDoc]);

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
          <VoiceRecorder onTranscriptionComplete={generate} />
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
