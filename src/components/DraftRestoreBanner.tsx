import { FileText, X } from 'lucide-react';
import type { SessionDraft } from '@/types/session';

interface DraftRestoreBannerProps {
  draft: SessionDraft;
  onRestore: () => void;
  onDismiss: () => void;
}

const formatRelativeTime = (date: Date): string => {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours}h ago`;
};

export const DraftRestoreBanner = ({ draft, onRestore, onDismiss }: DraftRestoreBannerProps) => (
  <div
    className="flex items-center gap-3 rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm"
    role="status"
    aria-live="polite"
  >
    <FileText className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
    <p className="flex-1 text-amber-800 dark:text-amber-300">
      You have an unsaved draft from {formatRelativeTime(draft.savedAt)}.
    </p>
    <div className="flex shrink-0 items-center gap-2">
      <button
        onClick={onRestore}
        className="rounded-md bg-amber-600 dark:bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors"
      >
        Restore
      </button>
      <button
        onClick={onDismiss}
        className="rounded p-1 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800/30 transition-colors"
        aria-label="Dismiss draft"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
);
