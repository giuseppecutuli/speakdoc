import { useState } from 'react';
import { ClipboardPaste, ArrowRight, X } from 'lucide-react';
import { useRecordingStore } from '@/hooks/useRecordingStore';

interface TextPasteInputProps {
  onTranscriptionComplete: (text: string) => void;
}

export const TextPasteInput = ({ onTranscriptionComplete }: TextPasteInputProps) => {
  const [text, setText] = useState('');
  const [expanded, setExpanded] = useState(false);
  const { appendTranscription, reset, setStatus } = useRecordingStore();

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    reset();
    appendTranscription(trimmed, true);
    setStatus('done');
    onTranscriptionComplete(trimmed);
    setText('');
    setExpanded(false);
  };

  const handleCancel = () => {
    setText('');
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        aria-label="Paste meeting text"
      >
        <ClipboardPaste className="h-4 w-4" />
        Paste Text
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit();
          if (e.key === 'Escape') handleCancel();
        }}
        placeholder="Paste your meeting transcript or notes here…"
        rows={6}
        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Meeting text input"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Process text"
        >
          <ArrowRight className="h-4 w-4" />
          Process
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          aria-label="Cancel"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
          {text.trim() ? `${text.trim().split(/\s+/).length} words` : ''}
        </span>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Ctrl+Enter to process · Esc to cancel
      </p>
    </div>
  );
};
