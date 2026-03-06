import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { SettingsPage } from '@/components/SettingsPage';
import { LanguageSelectionModal } from '@/features/language-selection/LanguageSelectionModal';
import { VoiceRecorder } from '@/features/voice-input/VoiceRecorder';
import { TranscriptionDisplay } from '@/features/transcription/TranscriptionDisplay';
import { DocumentationEditor } from '@/features/documentation-generation/DocumentationEditor';
import { TemplateSelector } from '@/features/documentation-generation/TemplateSelector';
import { LearningPanel } from '@/features/learning/LearningPanel';
import { SessionHistory } from '@/features/learning/SessionHistory';
import { AudioFileImporter } from '@/features/voice-input/AudioFileImporter';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';
import { useTemplateStore } from '@/hooks/useTemplateStore';
import { useAISession } from '@/hooks/useAISession';
import { sessionRepository } from '@/utils/repositories';
import { SESSION_RETENTION_DAYS } from '@/constants/config';

export const App = () => {
  const [view, setView] = useState<'main' | 'settings'>('main');
  const [showLanguageModal, setShowLanguageModal] = useState(true);
  const { loadFromStorage, unlockSession } = useLanguageStore();
  const { error: docError, reset: resetDoc } = useDocumentationStore();
  const { loadFromStorage: loadTemplate } = useTemplateStore();
  const { generate } = useAISession();

  useEffect(() => {
    loadFromStorage();
    loadTemplate();

    // Auto-cleanup sessions older than retention period
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - SESSION_RETENTION_DAYS);
    sessionRepository.deleteOlderThan(cutoff).catch(() => undefined);
  }, [loadFromStorage, loadTemplate]);

  const handleLanguageConfirm = () => {
    setShowLanguageModal(false);
  };

  const handleRegenerate = useCallback(() => {
    unlockSession();
    setShowLanguageModal(true);
    resetDoc();
  }, [unlockSession, resetDoc]);

  if (view === 'settings') {
    return <SettingsPage onBack={() => setView('main')} />;
  }

  return (
    <Layout onSettingsClick={() => setView('settings')}>
      <LanguageSelectionModal open={showLanguageModal} onConfirm={handleLanguageConfirm} />

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">Voice Recording</h2>
            <div className="flex items-center gap-4">
              <TemplateSelector />
              <button
                onClick={() => setShowLanguageModal(true)}
                className="text-xs text-indigo-600 hover:underline"
              >
                Change languages
              </button>
            </div>
          </div>
          <VoiceRecorder onTranscriptionComplete={generate} />
          <div className="mt-4 border-t border-slate-100 pt-4">
            <AudioFileImporter onTranscriptionComplete={generate} />
          </div>
        </div>

        <LearningPanel />

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

        <SessionHistory />
      </div>
    </Layout>
  );
};

export default App;
