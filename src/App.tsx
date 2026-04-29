import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { SettingsPage } from '@/components/SettingsPage';
import { HelpPanel } from '@/components/HelpPanel';
import { ActiveSettingsSummary } from '@/components/ActiveSettingsSummary';
import { DraftRestoreBanner } from '@/components/DraftRestoreBanner';
import { LanguageSelectionModal } from '@/features/language-selection/LanguageSelectionModal';
import { VoiceRecorder } from '@/features/voice-input/VoiceRecorder';
import { TranscriptionDisplay } from '@/features/transcription/TranscriptionDisplay';
import { DocumentationEditor } from '@/features/documentation-generation/DocumentationEditor';
import { GenerateDocumentationCta } from '@/features/documentation-generation/GenerateDocumentationCta';
import { TemplateSelector } from '@/features/documentation-generation/TemplateSelector';
import { LearningPanel } from '@/features/learning/LearningPanel';
import { SessionHistory } from '@/features/learning/SessionHistory';
import { SessionWorkspaceToolbar } from '@/features/learning/SessionWorkspaceToolbar';
import { InProgressDrafts } from '@/components/InProgressDrafts';
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
import {
  buildWorkRestoreSnapshot,
  applyWorkRestoreSnapshot,
} from '@/features/learning/work-restore';
import {
  DRAFT_RESTORE_BANNER_MAX_AGE_MS,
  shouldOfferDraftRestoreBanner,
} from '@/features/learning/draft-restore';

export const App = () => {
  const [view, setView] = useState<'main' | 'settings'>('main');
  const [showLanguageModal, setShowLanguageModal] = useState(
    () => !localStorage.getItem(STORAGE_KEYS.SPEAKING_LANGUAGE),
  );
  const [pendingDraft, setPendingDraft] = useState<SessionDraft | null>(null);
  const [draftListRevision, setDraftListRevision] = useState(0);

  const { loadFromStorage, unlockSession, speakingLanguage, outputLanguage, setLanguages } = useLanguageStore();
  const { error: docError, reset: resetDoc, formattedOutput, selectedFormat, setFormattedOutput, setFormat } = useDocumentationStore();
  const { loadFromStorage: loadTemplate } = useTemplateStore();
  const { setTranscription, setAudioBlob } = useRecordingStore();
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
      if (shouldOfferDraftRestoreBanner(draft, DRAFT_RESTORE_BANNER_MAX_AGE_MS)) {
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

  const handleRestoreSession = useCallback(
    (session: DocumentationSession) => {
      applyWorkRestoreSnapshot(buildWorkRestoreSnapshot(session), {
        setLanguages,
        setTranscription,
        setAudioBlob,
        setFormat,
        setFormattedOutput,
      });
      setShowLanguageModal(false);
    },
    [setLanguages, setTranscription, setAudioBlob, setFormat, setFormattedOutput],
  );

  const applyDraft = useCallback(
    (draft: SessionDraft) => {
      applyWorkRestoreSnapshot(buildWorkRestoreSnapshot(draft), {
        setLanguages,
        setTranscription,
        setAudioBlob,
        setFormat,
        setFormattedOutput,
      });
      setShowLanguageModal(false);
    },
    [setLanguages, setTranscription, setAudioBlob, setFormat, setFormattedOutput],
  );

  const handleRestoreDraft = useCallback(() => {
    if (!pendingDraft) return;
    applyDraft(pendingDraft);
    setPendingDraft(null);
  }, [pendingDraft, applyDraft]);

  const handleRestoreDraftFromList = useCallback(
    (draft: SessionDraft) => {
      applyDraft(draft);
      setPendingDraft(null);
    },
    [applyDraft],
  );

  const handleDismissDraft = useCallback(() => {
    setPendingDraft((current) => {
      if (current?.id != null) {
        draftRepository.delete(current.id).catch(() => undefined);
      }
      return null;
    });
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

      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)_minmax(0,20rem)] md:items-start md:gap-6 xl:gap-8">
        <div className="order-1 min-w-0 space-y-6 md:order-none md:col-start-2 md:row-start-1">
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
            <VoiceRecorder />
            <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-4 flex flex-col gap-4">
              <AudioFileImporter />
              <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                <TextPasteInput />
              </div>
            </div>
          </div>

          <TranscriptionDisplay />

          <GenerateDocumentationCta onGenerate={generate} />

          <LearningPanel />

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
        </div>

        <aside
          className="order-2 flex min-w-0 flex-col gap-6 md:order-none md:col-start-1 md:row-start-1 md:sticky md:top-24 md:self-start md:max-h-[calc(100vh-7rem)] md:overflow-y-auto md:border-r md:border-slate-200 md:pr-6 dark:md:border-slate-700"
          aria-label="Active settings and quick guide"
        >
          <ActiveSettingsSummary compact onOpenSettings={() => setView('settings')} />
          <HelpPanel compact />
        </aside>

        <aside
          className="order-3 flex min-w-0 flex-col gap-6 md:order-none md:col-start-3 md:row-start-1 md:sticky md:top-24 md:self-start md:max-h-[calc(100vh-7rem)] md:overflow-y-auto md:border-l md:border-slate-200 md:pl-6 dark:md:border-slate-700"
          aria-label="In progress drafts, workspace actions, and session history"
        >
          <InProgressDrafts
            onRestore={handleRestoreDraftFromList}
            compact
            listRevision={draftListRevision}
          />
          <SessionWorkspaceToolbar
            compact
            onDraftsMutated={() => setDraftListRevision((n) => n + 1)}
          />
          <SessionHistory onRestore={handleRestoreSession} compact />
        </aside>
      </div>
    </Layout>
  );
};

export default App;
