import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { SettingsPage } from '@/components/SettingsPage';
import { HelpPanel } from '@/components/HelpPanel';
import { DraftRestoreBanner } from '@/components/DraftRestoreBanner';
import { LanguageSelectionModal } from '@/features/language-selection/LanguageSelectionModal';
import { VoiceRecorder } from '@/features/voice-input/VoiceRecorder';
import { TranscriptionDisplay } from '@/features/transcription/TranscriptionDisplay';
import { DocumentationEditor } from '@/features/documentation-generation/DocumentationEditor';
import { TemplateSelector } from '@/features/documentation-generation/TemplateSelector';
import { LearningPanel } from '@/features/learning/LearningPanel';
import { SessionHistory } from '@/features/learning/SessionHistory';
import { AudioFileImporter } from '@/features/voice-input/AudioFileImporter';
import { TextPasteInput } from '@/features/voice-input/TextPasteInput';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import { STORAGE_KEYS } from '@/constants/config';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';
import { useTemplateStore } from '@/hooks/useTemplateStore';
import { useRecordingStore } from '@/hooks/useRecordingStore';
import { useAISession } from '@/hooks/useAISession';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useDraftPersistence } from '@/hooks/useDraftPersistence';
import { downloadAsFile } from '@/features/export/export.service';
import { sessionRepository, draftRepository } from '@/utils/repositories';
import { SESSION_RETENTION_DAYS } from '@/constants/config';
import type { DocumentationSession, SessionDraft } from '@/types/session';
import type { OutputFormat } from '@/types/documentation';
import type { LanguageCode } from '@/types/language';

const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export const App = () => {
  const [view, setView] = useState<'main' | 'settings'>('main');
  const [showLanguageModal, setShowLanguageModal] = useState(
    () => !localStorage.getItem(STORAGE_KEYS.SPEAKING_LANGUAGE),
  );
  const [pendingDraft, setPendingDraft] = useState<SessionDraft | null>(null);

  const { loadFromStorage, unlockSession, speakingLanguage, outputLanguage, setLanguages } = useLanguageStore();
  const { error: docError, reset: resetDoc, formattedOutput, selectedFormat, setFormattedOutput, setFormat } = useDocumentationStore();
  const { loadFromStorage: loadTemplate } = useTemplateStore();
  const { setTranscription } = useRecordingStore();
  const { generate } = useAISession();

  useDraftPersistence();

  useEffect(() => {
    loadFromStorage();
    loadTemplate();

    // Auto-cleanup sessions older than retention period
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - SESSION_RETENTION_DAYS);
    sessionRepository.deleteOlderThan(cutoff).catch(() => undefined);

    // Check for unsaved draft on mount
    draftRepository.getLatest().then((draft) => {
      if (!draft) return;
      const age = Date.now() - new Date(draft.savedAt).getTime();
      if (age < DRAFT_MAX_AGE_MS && (draft.transcription || draft.generatedDoc)) {
        setPendingDraft(draft);
      }
    }).catch(() => undefined);
  }, [loadFromStorage, loadTemplate]);

  const handleLanguageConfirm = () => {
    setShowLanguageModal(false);
  };

  const handleRegenerate = useCallback(() => {
    unlockSession();
    setShowLanguageModal(true);
    resetDoc();
  }, [unlockSession, resetDoc]);

  const handleRestoreSession = useCallback((session: DocumentationSession) => {
    setLanguages(session.speakingLanguage as LanguageCode, session.outputLanguage as LanguageCode);
    setTranscription(session.transcription);
    setFormat(session.format as OutputFormat);
    setFormattedOutput(session.generatedDoc);
    setShowLanguageModal(false);
  }, [setLanguages, setTranscription, setFormat, setFormattedOutput]);

  const handleRestoreDraft = useCallback(() => {
    if (!pendingDraft) return;
    setLanguages(pendingDraft.speakingLanguage as LanguageCode, pendingDraft.outputLanguage as LanguageCode);
    setTranscription(pendingDraft.transcription);
    setFormat(pendingDraft.format as OutputFormat);
    setFormattedOutput(pendingDraft.generatedDoc);
    setShowLanguageModal(false);
    setPendingDraft(null);
  }, [pendingDraft, setLanguages, setTranscription, setFormat, setFormattedOutput]);

  const handleDismissDraft = useCallback(() => {
    setPendingDraft(null);
    draftRepository.clear().catch(() => undefined);
  }, []);

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
        {pendingDraft && (
          <DraftRestoreBanner
            draft={pendingDraft}
            onRestore={handleRestoreDraft}
            onDismiss={handleDismissDraft}
          />
        )}

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
          <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-4 flex flex-col gap-4">
            <AudioFileImporter onTranscriptionComplete={generate} />
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
              <TextPasteInput onTranscriptionComplete={generate} />
            </div>
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

        <SessionHistory onRestore={handleRestoreSession} />
      </div>
    </Layout>
  );
};

export default App;
