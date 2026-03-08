import { useState, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { useRecordingStore } from '@/hooks/useRecordingStore';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import { cn } from '@/utils/cn';

export const TranscriptionDisplay = () => {
  const { transcription, interimTranscription, status, setTranscription } = useRecordingStore();
  const { speakingLanguage } = useLanguageStore();

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const hasContent = transcription || interimTranscription;
  const langLabel = SUPPORTED_LANGUAGES[speakingLanguage].label;
  const isDone = status === 'done';

  // Reset edit mode when transcription changes externally (new recording/import)
  useEffect(() => {
    setIsEditing(false);
  }, [transcription]);

  const handleEditStart = () => {
    setDraft(transcription);
    setIsEditing(true);
  };

  const handleSave = () => {
    setTranscription(draft);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (!hasContent && status === 'idle') return null;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Transcription</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400">
            {langLabel}
          </span>
          {isDone && !isEditing && transcription && (
            <button
              type="button"
              onClick={handleEditStart}
              className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              aria-label="Edit transcription"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          )}
          {isEditing && (
            <>
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                aria-label="Save transcription"
              >
                <Check className="h-3 w-3" />
                Save
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="Cancel editing"
              >
                <X className="h-3 w-3" />
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full resize-none rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-24"
          aria-label="Edit transcription"
          autoFocus
        />
      ) : (
        <div
          className={cn(
            'min-h-16 text-sm leading-relaxed',
            !hasContent && 'text-slate-400 dark:text-slate-500 italic',
          )}
          aria-live="polite"
          aria-label="Live transcription"
        >
          {hasContent ? (
            <>
              <span className="text-slate-800 dark:text-slate-200">{transcription}</span>
              {interimTranscription && (
                <span className="text-slate-400 dark:text-slate-500 italic"> {interimTranscription}</span>
              )}
            </>
          ) : (
            'Speak to see transcription…'
          )}
        </div>
      )}
    </div>
  );
};
