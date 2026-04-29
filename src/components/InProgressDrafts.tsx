import { useState, useEffect, useCallback } from 'react';
import { FileEdit, RotateCcw, Trash2 } from 'lucide-react';
import { draftRepository } from '@/utils/repositories';
import type { SessionDraft } from '@/types/session';
import { buildDefaultDraftTitle } from '@/utils/session-naming';
import { formatDateTimeMedium } from '@/utils/datetime-display';
import { draftHasRestoreableContent } from '@/features/learning/draft-restore';
import { cn } from '@/utils/cn';

interface InProgressDraftsProps {
  onRestore: (draft: SessionDraft) => void;
  /** Right sidebar: lighter chrome to match SessionHistory compact */
  compact?: boolean;
}

export const InProgressDrafts = ({ onRestore, compact = false }: InProgressDraftsProps) => {
  const [drafts, setDrafts] = useState<SessionDraft[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    draftRepository
      .listRecent(20)
      .then((rows) => {
        const withContent = rows.filter(draftHasRestoreableContent);
        setDrafts(withContent);
        setLoaded(true);
      })
      .catch(() => {
        setDrafts([]);
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleDelete = async (id: number) => {
    try {
      await draftRepository.delete(id);
      refresh();
    } catch {
      // silent
    }
  };

  if (!loaded || drafts.length === 0) return null;

  return (
    <div
      data-in-progress-drafts
      className={cn(
        'rounded-xl border bg-white dark:bg-slate-800 shadow-sm',
        {
          'border-slate-200/70 dark:border-slate-700/80 p-4 shadow-none dark:bg-slate-800/90': compact,
          'border-slate-200 dark:border-slate-700 p-6': !compact,
        },
      )}
    >
      <div className={cn('flex items-center gap-2', { 'mb-3': compact, 'mb-4': !compact })}>
        <FileEdit
          className={cn('shrink-0 text-slate-500 dark:text-slate-400', {
            'h-3.5 w-3.5': compact,
            'h-4 w-4': !compact,
          })}
          aria-hidden
        />
        <h2
          className={cn({
            'text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400': compact,
            'text-base font-semibold text-slate-900 dark:text-slate-100': !compact,
          })}
        >
          In progress
        </h2>
      </div>
      <p
        className={cn('text-slate-500 dark:text-slate-400', {
          'mb-2 text-[11px] leading-snug': compact,
          'mb-3 text-xs': !compact,
        })}
      >
        Saved automatically in your browser. Restore to continue, or delete when no longer needed.
      </p>
      <ul className="space-y-2" data-testid="in-progress-drafts-list">
        {drafts.map((draft) => {
          const title = draft.title?.trim() || buildDefaultDraftTitle(new Date(draft.savedAt));
          const previewSource = draft.transcription?.trim() || draft.generatedDoc || '…';
          const preview =
            previewSource.length > 100 ? previewSource.slice(0, 100) + '…' : previewSource;
          return (
            <li
              key={draft.id}
              className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{title}</p>
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{preview}</p>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{formatDateTimeMedium(draft.savedAt)}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onRestore(draft);
                    void refresh();
                  }}
                  className="rounded p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800"
                  title="Restore draft"
                  aria-label="Restore draft"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => draft.id != null && void handleDelete(draft.id)}
                  className="rounded p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800"
                  title="Delete draft"
                  aria-label="Delete draft"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
