import { useState, useCallback } from 'react';
import { Save, FilePlus2, Trash2, Pencil } from 'lucide-react';
import { useRecordingStore } from '@/hooks/useRecordingStore';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';
import {
  persistCurrentDraftNow,
  deleteActiveDraftIfAny,
  resetWorkspaceStores,
  beginNewWorkspaceSession,
  getActiveDraftId,
} from '@/features/learning/session-draft-actions';
import { draftRepository } from '@/utils/repositories';
import { cn } from '@/utils/cn';
import { DraftTitleDialog, type DraftTitleDialogVariant } from '@/features/learning/DraftTitleDialog';

interface SessionWorkspaceToolbarProps {
  /** Call after a successful save or destructive draft change so the sidebar list refreshes. */
  onDraftsMutated?: () => void;
  /** Narrow right rail: tighter chrome and stacked actions. */
  compact?: boolean;
}

const CLEAR_CONFIRM =
  'Discard the current transcription and documentation on this page, and remove the active in-progress draft from this browser? This cannot be undone.';

export const SessionWorkspaceToolbar = ({ onDraftsMutated, compact = false }: SessionWorkspaceToolbarProps) => {
  const status = useRecordingStore((s) => s.status);
  const transcription = useRecordingStore((s) => s.transcription);
  const is_generating = useDocumentationStore((s) => s.isGenerating);
  const formatted_output = useDocumentationStore((s) => s.formattedOutput);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [titleDialogVariant, setTitleDialogVariant] = useState<DraftTitleDialogVariant>('save');
  const [draftTitleInput, setDraftTitleInput] = useState('');
  const [titleDialogBusy, setTitleDialogBusy] = useState(false);

  const is_busy_capture =
    status === 'recording' || status === 'paused' || status === 'processing';
  const workspace_busy = is_busy_capture || is_generating || sessionBusy;

  const has_content =
    Boolean(transcription.trim()) || Boolean(formatted_output.trim());
  const can_open_save_dialog = has_content && !workspace_busy;

  const bump_notice_clear = useCallback((message: string) => {
    setSaveNotice(message);
    globalThis.setTimeout(() => setSaveNotice(null), 2500);
  }, []);

  const open_save_title_dialog = useCallback(async () => {
    if (!can_open_save_dialog) return;
    setTitleDialogVariant('save');
    const id = getActiveDraftId();
    if (id == null) {
      setDraftTitleInput('');
    } else {
      try {
        const row = await draftRepository.getById(id);
        setDraftTitleInput(row?.title?.trim() ?? '');
      } catch {
        setDraftTitleInput('');
      }
    }
    setTitleDialogOpen(true);
  }, [can_open_save_dialog]);

  const open_rename_title_dialog = useCallback(async () => {
    if (workspace_busy || titleDialogBusy) return;
    const id = getActiveDraftId();
    if (id == null) {
      bump_notice_clear('Save once to create a draft, then you can edit its name.');
      return;
    }
    setTitleDialogVariant('rename');
    try {
      const row = await draftRepository.getById(id);
      setDraftTitleInput(row?.title?.trim() ?? '');
    } catch {
      setDraftTitleInput('');
    }
    setTitleDialogOpen(true);
  }, [workspace_busy, titleDialogBusy, bump_notice_clear]);

  const handle_title_dialog_confirm = async () => {
    const trimmed = draftTitleInput.trim();
    setTitleDialogBusy(true);
    setSaveNotice(null);
    try {
      if (titleDialogVariant === 'save') {
        if (!has_content) return;
        const saved = await persistCurrentDraftNow();
        if (saved?.id != null && trimmed) {
          await draftRepository.update(saved.id, { title: trimmed });
        }
        bump_notice_clear('Saved to in-progress drafts');
        onDraftsMutated?.();
        setTitleDialogOpen(false);
      } else {
        const id = getActiveDraftId();
        if (id == null) {
          bump_notice_clear('No active draft to rename.');
          setTitleDialogOpen(false);
          return;
        }
        await draftRepository.update(id, { title: trimmed || undefined });
        bump_notice_clear('Draft name updated');
        onDraftsMutated?.();
        setTitleDialogOpen(false);
      }
    } catch {
      bump_notice_clear(
        titleDialogVariant === 'save' ? 'Could not save — try again' : 'Could not update name — try again',
      );
    } finally {
      setTitleDialogBusy(false);
    }
  };

  const handle_new_session = async () => {
    if (workspace_busy || sessionBusy) return;
    setSessionBusy(true);
    setSaveNotice(null);
    try {
      await beginNewWorkspaceSession();
      bump_notice_clear('New session started');
      onDraftsMutated?.();
    } catch {
      bump_notice_clear('Could not start new session — try again');
    } finally {
      setSessionBusy(false);
    }
  };

  const handle_clear = async () => {
    if (workspace_busy || sessionBusy) return;
    if (!globalThis.confirm(CLEAR_CONFIRM)) return;
    setSessionBusy(true);
    setSaveNotice(null);
    try {
      await deleteActiveDraftIfAny();
      draftRepository.beginNewDraft();
      resetWorkspaceStores();
      bump_notice_clear('Workspace cleared');
      onDraftsMutated?.();
    } catch {
      bump_notice_clear('Could not clear — try again');
    } finally {
      setSessionBusy(false);
    }
  };

  const icon_class = cn('shrink-0', compact ? 'h-3.5 w-3.5' : 'h-4 w-4');

  return (
    <div
      data-session-workspace-toolbar
      className={cn('rounded-xl border bg-white dark:bg-slate-800', {
        'border-slate-200/70 dark:border-slate-700/80 p-4 shadow-none dark:bg-slate-800/90': compact,
        'border-slate-200 dark:border-slate-700 p-4 shadow-sm': !compact,
      })}
      aria-label="Session and draft actions"
    >
      <DraftTitleDialog
        open={titleDialogOpen}
        onOpenChange={(next_open) => {
          if (!next_open && !titleDialogBusy) setTitleDialogOpen(false);
        }}
        variant={titleDialogVariant}
        titleValue={draftTitleInput}
        onTitleChange={setDraftTitleInput}
        onConfirm={handle_title_dialog_confirm}
        isBusy={titleDialogBusy}
      />

      <p
        className={cn('mb-3 text-slate-600 dark:text-slate-400', {
          'text-[11px] leading-snug': compact,
          'text-sm': !compact,
        })}
      >
        Save opens a dialog to optionally name your draft. Use Edit draft name to rename the current draft without
        saving again. New session clears the page (saving first when there is content); Clear removes the active draft.
      </p>
      {compact && (
        <p className="mb-3 text-[11px] leading-snug text-slate-500 dark:text-slate-400">
          <strong className="font-medium text-slate-600 dark:text-slate-300">Names:</strong>{' '}
          drafts — Save dialog, <span className="whitespace-nowrap">Edit draft name</span>, or{' '}
          <span className="whitespace-nowrap">Rename</span> in the In progress list. Saved sessions — after Generate
          documentation, <span className="whitespace-nowrap">Name session</span> in the doc header or{' '}
          <span className="whitespace-nowrap">Rename</span> under Session History.
        </p>
      )}
      <div className={cn('flex gap-2', compact ? 'flex-col' : 'flex-wrap')}>
        <button
          type="button"
          disabled={!can_open_save_dialog}
          onClick={() => void open_save_title_dialog()}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            compact ? 'w-full justify-center py-2 text-xs' : 'py-2 text-sm',
          )}
          aria-label="Save draft and optionally set a name"
        >
          <Save className={icon_class} aria-hidden />
          Save
        </button>
        <button
          type="button"
          disabled={workspace_busy || titleDialogBusy}
          onClick={() => void open_rename_title_dialog()}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/40 px-3 font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            compact ? 'w-full justify-center py-2 text-xs' : 'py-2 text-sm',
          )}
          aria-label="Edit current draft name"
        >
          <Pencil className={icon_class} aria-hidden />
          Edit draft name
        </button>
        <button
          type="button"
          disabled={workspace_busy || sessionBusy}
          onClick={() => void handle_new_session()}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            compact ? 'w-full justify-center py-2 text-xs' : 'py-2 text-sm',
          )}
          aria-label="Save current work then start a new session"
        >
          <FilePlus2 className={icon_class} aria-hidden />
          New session
        </button>
        <button
          type="button"
          disabled={workspace_busy || sessionBusy}
          onClick={() => void handle_clear()}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/30 px-3 font-semibold text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            compact ? 'w-full justify-center py-2 text-xs' : 'py-2 text-sm',
          )}
          aria-label="Clear workspace and remove active draft"
        >
          <Trash2 className={icon_class} aria-hidden />
          Clear workspace
        </button>
      </div>
      {saveNotice != null && saveNotice !== '' && (
        <output
          className={cn('mt-2 block text-slate-600 dark:text-slate-400', compact ? 'text-[11px]' : 'text-xs')}
          aria-live="polite"
        >
          {saveNotice}
        </output>
      )}
    </div>
  );
};
