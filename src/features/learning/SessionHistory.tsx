import { useState, useEffect, useRef } from 'react';
import { Clock, Copy, Download, ChevronDown, ChevronUp, Trash2, RotateCcw, Pencil, Check } from 'lucide-react';
import { sessionRepository } from '@/utils/repositories';
import type { DocumentationSession } from '@/types/session';
import { copyToClipboard, downloadAsFile, downloadBlob } from '@/features/export/export.service';
import { coerceOutputFormat } from '@/types/documentation';
import { buildDefaultSessionName } from '@/utils/session-naming';
import { getStoredAudioBlob } from '@/utils/audio-chunk-storage';
import { formatDateTimeMedium } from '@/utils/datetime-display';
import { audioBlobDownloadExtension } from '@/utils/audio-blob-extension';
import { deferReactState } from '@/utils/defer-react-state';
import { cn } from '@/utils/cn';

const formatSize = (text: string): string => {
  const kb = Math.ceil(new Blob([text]).size / 1024);
  return `${kb} KB`;
};

const SESSION_PREVIEW_LENGTH = 120;

interface SessionRowProps {
  session: DocumentationSession;
  onDelete: (id: number) => void;
  onRestore: (session: DocumentationSession) => void;
  onRename: (id: number, name: string) => void;
}

const SessionRow = ({ session, onDelete, onRestore, onRename }: SessionRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(session.name ?? '');
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const displayTitle =
    session.name?.trim() || buildDefaultSessionName(new Date(session.createdAt));

  useEffect(() => {
    if (isEditingName) nameInputRef.current?.focus();
  }, [isEditingName]);

  useEffect(() => {
    const next = session.name ?? '';
    deferReactState(() => {
      setNameDraft(next);
    });
  }, [session.name, session.id]);

  const handleCopy = async () => {
    try {
      await copyToClipboard(session.generatedDoc);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent
    }
  };

  const handleDownload = () => {
    downloadAsFile(session.generatedDoc, coerceOutputFormat(String(session.format)));
  };

  const handleDownloadAudio = () => {
    const blob = getStoredAudioBlob(session);
    if (!blob) return;
    const ext = audioBlobDownloadExtension(blob);
    const safe = displayTitle.replaceAll(/[/\\?%*:|"<>]/g, '-').slice(0, 80);
    downloadBlob(blob, `${safe}.${ext}`);
  };

  const handleSaveName = async () => {
    const trimmed = nameDraft.trim();
    await sessionRepository.update(session.id!, { name: trimmed || undefined });
    onRename(session.id!, trimmed);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') { setNameDraft(session.name ?? ''); setIsEditingName(false); }
  };

  const handleDeleteClick = () => {
    if (confirmDelete) {
      onDelete(session.id!);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  const preview =
    session.transcription.length > SESSION_PREVIEW_LENGTH
      ? session.transcription.slice(0, SESSION_PREVIEW_LENGTH) + '…'
      : session.transcription;

  return (
    <li
      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
      data-testid="session-row"
    >
      <div className="flex w-full items-start gap-3 p-3">
        <div className="min-w-0 flex-1">
          {isEditingName ? (
            <div className="flex items-center gap-1 mb-1">
              <input
                ref={nameInputRef}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={handleNameKeyDown}
                placeholder="Session name…"
                className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
              />
              <button
                onClick={handleSaveName}
                className="rounded p-0.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                aria-label="Save name"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 group mb-0.5">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate" title={displayTitle}>
                {displayTitle}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setNameDraft(session.name ?? '');
                  setIsEditingName(true);
                }}
                className="flex items-center gap-0.5 rounded px-1 py-0.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors opacity-70 group-hover:opacity-100"
                title="Rename session"
              >
                <Pencil className="h-3 w-3" />
                Rename
              </button>
            </div>
          )}
          <button
            className="w-full text-left"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
          <div className="space-y-0.5">
            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">{preview}</p>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{formatDateTimeMedium(session.createdAt)}</span>
              <span className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 font-mono">
                {session.speakingLanguage}→{session.outputLanguage}
              </span>
              <span className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 uppercase font-mono">
                {session.format}
              </span>
              <span className="rounded bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 text-indigo-600 dark:text-indigo-400">
                {session.aiBackend}
              </span>
              <span className="rounded bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 font-mono text-slate-500 dark:text-slate-400">
                {formatSize(session.generatedDoc)}
              </span>
            </div>
          </div>
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-1 mt-0.5">
          <button
            onClick={() => onRestore(session)}
            className="rounded p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Restore session"
            title="Restore this session"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleDeleteClick}
            className={cn('rounded p-1 transition-colors', {
              'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30': confirmDelete,
              'text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700':
                !confirmDelete,
            })}
            aria-label={confirmDelete ? 'Confirm delete' : 'Delete session'}
            title={confirmDelete ? 'Click again to confirm' : 'Delete session'}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {expanded ? (
            <button onClick={() => setExpanded(false)} aria-label="Collapse">
              <ChevronUp className="h-4 w-4 text-slate-400" />
            </button>
          ) : (
            <button onClick={() => setExpanded(true)} aria-label="Expand">
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-700 p-3 space-y-3">
          <pre className="max-h-48 overflow-y-auto rounded-md bg-slate-50 dark:bg-slate-900 p-2 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {session.generatedDoc}
          </pre>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              aria-label="Copy generated doc"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              aria-label="Download generated doc"
            >
              <Download className="h-3.5 w-3.5" />
              Download doc
            </button>
            {getStoredAudioBlob(session) && (
              <button
                type="button"
                onClick={handleDownloadAudio}
                className="flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                aria-label="Download session audio"
              >
                <Download className="h-3.5 w-3.5" />
                Download audio
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
};

interface SessionHistoryProps {
  onRestore?: (session: DocumentationSession) => void;
  /** Narrow right column: lighter chrome so main transcription flow stays primary */
  compact?: boolean;
}

export const SessionHistory = ({ onRestore, compact = false }: SessionHistoryProps) => {
  const [sessions, setSessions] = useState<DocumentationSession[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    sessionRepository
      .getRecent(20)
      .then((data) => { if (!cancelled) { setSessions(data); setLoaded(true); } })
      .catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await sessionRepository.delete(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      // silent — row stays if delete fails
    }
  };

  const handleRename = (id: number, name: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: name || undefined } : s)),
    );
  };

  const handleRestore = (session: DocumentationSession) => {
    onRestore?.(session);
  };

  if (!loaded || sessions.length === 0) return null;

  return (
    <div
      data-session-history
      className={cn(
        'rounded-xl border bg-white dark:bg-slate-800 shadow-sm',
        {
          'border-slate-200/70 dark:border-slate-700/80 p-4 shadow-none dark:bg-slate-800/90': compact,
          'border-slate-200 dark:border-slate-700 p-6': !compact,
        },
      )}
    >
      <div className={cn('flex items-center gap-2', { 'mb-3': compact, 'mb-4': !compact })}>
        <Clock
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
          Session History
        </h2>
      </div>
      <ul className="space-y-2" data-testid="session-history-list">
        {sessions.map((session) => (
          <SessionRow
            key={session.id}
            session={session}
            onDelete={handleDelete}
            onRestore={handleRestore}
            onRename={handleRename}
          />
        ))}
      </ul>
    </div>
  );
};
