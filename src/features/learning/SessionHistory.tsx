import { useState, useEffect } from 'react';
import { Clock, Copy, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { sessionRepository } from '@/utils/repositories';
import type { DocumentationSession } from '@/types/session';
import { copyToClipboard, downloadAsFile } from '@/features/export/export.service';
import type { OutputFormat } from '@/types/documentation';

const formatDate = (date: Date): string =>
  new Date(date).toLocaleDateString(undefined, { dateStyle: 'medium' }) +
  ' ' +
  new Date(date).toLocaleTimeString(undefined, { timeStyle: 'short' });

const SESSION_PREVIEW_LENGTH = 120;

interface SessionRowProps {
  session: DocumentationSession;
}

const SessionRow = ({ session }: SessionRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

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
    downloadAsFile(session.generatedDoc, session.format as OutputFormat);
  };

  const preview =
    session.transcription.length > SESSION_PREVIEW_LENGTH
      ? session.transcription.slice(0, SESSION_PREVIEW_LENGTH) + '…'
      : session.transcription;

  return (
    <li
      className="rounded-lg border border-slate-200 bg-white shadow-sm"
      data-testid="session-row"
    >
      <button
        className="flex w-full items-start justify-between gap-3 p-3 text-left"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate text-sm font-medium text-slate-800">{preview}</p>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span>{formatDate(session.createdAt)}</span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">
              {session.speakingLanguage}→{session.outputLanguage}
            </span>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 uppercase font-mono">
              {session.format}
            </span>
            <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-600">
              {session.aiBackend}
            </span>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-3 space-y-3">
          <pre className="max-h-48 overflow-y-auto rounded-md bg-slate-50 p-2 text-xs text-slate-700 whitespace-pre-wrap">
            {session.generatedDoc}
          </pre>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              aria-label="Copy generated doc"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              aria-label="Download generated doc"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
          </div>
        </div>
      )}
    </li>
  );
};

export const SessionHistory = () => {
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

  if (!loaded || sessions.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-slate-500" />
        <h2 className="text-base font-semibold text-slate-900">Session History</h2>
      </div>
      <ul className="space-y-2" data-testid="session-history-list">
        {sessions.map((session) => (
          <SessionRow key={session.id} session={session} />
        ))}
      </ul>
    </div>
  );
};
