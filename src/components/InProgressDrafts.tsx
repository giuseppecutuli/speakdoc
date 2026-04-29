import { useState, useEffect, useCallback, useRef, type KeyboardEvent } from 'react';
import { FileEdit, RotateCcw, Trash2, Pencil, Check } from 'lucide-react';
import { draftRepository } from '@/utils/repositories';
import type { SessionDraft } from '@/types/session';
import { buildDefaultDraftTitle } from '@/utils/session-naming';
import { formatDateTimeMedium } from '@/utils/datetime-display';
import { draftHasRestoreableContent } from '@/features/learning/draft-restore';
import { deferReactState } from '@/utils/defer-react-state';
import { cn } from '@/utils/cn';

interface InProgressDraftsProps {
  onRestore: (draft: SessionDraft) => void;
  /** Right sidebar: lighter chrome to match SessionHistory compact */
  compact?: boolean;
  /** Increment (e.g. from parent state) to reload the list after toolbar save/clear. */
  listRevision?: number;
}

interface DraftListRowProps {
  draft: SessionDraft;
  compact: boolean;
  displayTitle: string;
  preview: string;
  formattedSavedAt: string;
  onRestore: (d: SessionDraft) => void;
  onRefresh: () => void;
}

async function deleteDraftRow(id: number, onRefresh: () => void) {
  try {
    await draftRepository.delete(id);
    onRefresh();
  } catch {
    // silent
  }
}

const DraftListRow = ({
  draft,
  compact,
  displayTitle,
  preview,
  formattedSavedAt,
  onRestore,
  onRefresh,
}: DraftListRowProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(draft.title ?? '');
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle) titleInputRef.current?.focus();
  }, [isEditingTitle]);

  useEffect(() => {
    const next = draft.title ?? '';
    deferReactState(() => {
      setTitleDraft(next);
    });
  }, [draft.title, draft.id]);

  const saveTitle = async () => {
    if (draft.id == null) return;
    const trimmed = titleDraft.trim();
    try {
      await draftRepository.update(draft.id, { title: trimmed || undefined });
      setIsEditingTitle(false);
      onRefresh();
    } catch {
      // silent
    }
  };

  const onTitleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') void saveTitle();
    if (e.key === 'Escape') {
      setTitleDraft(draft.title ?? '');
      setIsEditingTitle(false);
    }
  };

  return (
    <li
      className="flex items-start justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 p-3"
    >
      <div className="min-w-0 flex-1">
        {isEditingTitle ? (
          <div className="mb-1 flex flex-wrap items-center gap-1">
            <input
              ref={titleInputRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onKeyDown={onTitleKeydown}
              placeholder="Draft title…"
              className={cn(
                'min-w-0 flex-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-0.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500',
                compact ? 'text-[11px]' : 'text-xs',
              )}
            />
            <button
              type="button"
              onClick={() => void saveTitle()}
              className="rounded p-0.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
              aria-label="Save draft title"
            >
              <Check className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            </button>
          </div>
        ) : (
          <div className="group mb-0.5 flex items-center gap-1">
            <p
              className={cn('truncate font-medium text-slate-800 dark:text-slate-200', compact ? 'text-xs' : 'text-sm')}
              title={displayTitle}
            >
              {displayTitle}
            </p>
            <button
              type="button"
              onClick={() => {
                setTitleDraft(draft.title ?? '');
                setIsEditingTitle(true);
              }}
              className={cn(
                'flex shrink-0 items-center gap-0.5 rounded px-1 py-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300',
                compact ? 'text-[10px]' : 'text-xs',
                'opacity-70 transition-opacity group-hover:opacity-100',
              )}
              title="Rename draft"
            >
              <Pencil className={compact ? 'h-2.5 w-2.5' : 'h-3 w-3'} aria-hidden />
              {!compact && 'Rename'}
            </button>
          </div>
        )}
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{preview}</p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{formattedSavedAt}</p>
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => {
            onRestore(draft);
            onRefresh();
          }}
          className="rounded p-1.5 text-slate-400 hover:bg-white hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
          title="Restore draft"
          aria-label="Restore draft"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => draft.id != null && void deleteDraftRow(draft.id, onRefresh)}
          className="rounded p-1.5 text-slate-400 hover:bg-white hover:text-red-600 dark:hover:bg-slate-800 dark:hover:text-red-400"
          title="Delete draft"
          aria-label="Delete draft"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
};

export const InProgressDrafts = ({ onRestore, compact = false, listRevision = 0 }: InProgressDraftsProps) => {
  const [drafts, setDrafts] = useState<SessionDraft[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(() => {
    draftRepository
      .listRecent(20)
      .then((rows) => {
        const with_content = rows.filter(draftHasRestoreableContent);
        setDrafts(with_content);
        setLoaded(true);
      })
      .catch(() => {
        setDrafts([]);
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, listRevision]);

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
        Saved automatically in your browser. Rename a draft (pencil), restore to continue, or delete when no longer
        needed.
      </p>
      <ul className="space-y-2" data-testid="in-progress-drafts-list">
        {drafts.map((draft) => {
          const displayTitle = draft.title?.trim() || buildDefaultDraftTitle(new Date(draft.savedAt));
          const preview_source = draft.transcription?.trim() || draft.generatedDoc || '…';
          const preview =
            preview_source.length > 100 ? preview_source.slice(0, 100) + '…' : preview_source;
          return (
            <DraftListRow
              key={draft.id}
              draft={draft}
              compact={compact}
              displayTitle={displayTitle}
              preview={preview}
              formattedSavedAt={formatDateTimeMedium(draft.savedAt)}
              onRestore={onRestore}
              onRefresh={refresh}
            />
          );
        })}
      </ul>
    </div>
  );
};
