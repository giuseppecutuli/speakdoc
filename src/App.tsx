import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { SettingsPage } from '@/components/SettingsPage';
import { HelpPanel } from '@/components/HelpPanel';
import { LanguageSelectionModal } from '@/features/language-selection/LanguageSelectionModal';
import { VoiceRecorder } from '@/features/voice-input/VoiceRecorder';
import { TranscriptionDisplay } from '@/features/transcription/TranscriptionDisplay';
import { DocumentationEditor } from '@/features/documentation-generation/DocumentationEditor';
import { TemplateSelector } from '@/features/documentation-generation/TemplateSelector';
import { LearningPanel } from '@/features/learning/LearningPanel';
import { SessionHistory } from '@/features/learning/SessionHistory';
import { AudioFileImporter } from '@/features/voice-input/AudioFileImporter';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';
import { useTemplateStore } from '@/hooks/useTemplateStore';
import { useAISession } from '@/hooks/useAISession';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { downloadAsFile } from '@/features/export/export.service';
import { sessionRepository } from '@/utils/repositories';
import { SESSION_RETENTION_DAYS } from '@/constants/config';

export const App = () => {
  const [view, setView] = useState<'main' | 'settings'>('main');
  const [showLanguageModal, setShowLanguageModal] = useState(true);
  const { loadFromStorage, unlockSession, speakingLanguage, outputLanguage } = useLanguageStore();
  const { error: docError, reset: resetDoc, formattedOutput, selectedFormat } = useDocumentationStore();
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

  useKeyboardShortcuts({
    onSave: useCallback(() => {
      if (formattedOutput) downloadAsFile(formattedOutput, selectedFormat);
    }, [formattedOutput, selectedFormat]),
  });

  if (view === 'settings') {
    return <SettingsPage onBack={() => setView('main')} />;
  }

  return (
    <Layout onSettingsClick={() => setView('settings')}>
      <LanguageSelectionModal open={showLanguageModal} onConfirm={handleLanguageConfirm} />

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Voice Recording</h2>
            <div className="flex items-center gap-4">
              <TemplateSelector />
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs font-mono text-slate-600 dark:text-slate-300">
                  {SUPPORTED_LANGUAGES[speakingLanguage]?.label} → {SUPPORTED_LANGUAGES[outputLanguage]?.label}
                </span>
                <button
                  onClick={() => setShowLanguageModal(true)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Change
                </button>
              </div>
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
            className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-400"
            role="alert"
            aria-live="assertive"
          >
            <strong>Error:</strong> {docError}
          </div>
        )}

        <DocumentationEditor onRegenerate={handleRegenerate} />

        <HelpPanel />

        <SessionHistory />
      </div>
    </Layout>
  );
};

export default App;
