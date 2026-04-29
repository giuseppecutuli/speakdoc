import { useState, useEffect } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { useRecordingStore } from '@/hooks/useRecordingStore';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import { cn } from '@/utils/cn';
import { deferReactState } from '@/utils/defer-react-state';

export const TranscriptionDisplay = () => {
  const { transcription, interimTranscription, status, capture_mode, setTranscription } = useRecordingStore();
  const { speakingLanguage } = useLanguageStore();

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const has_content = Boolean(transcription || interimTranscription);
  const lang_label = SUPPORTED_LANGUAGES[speakingLanguage].label;
  const is_done = status === 'done';
  const is_recording = status === 'recording';
  const is_paused = status === 'paused';
  const is_processing = status === 'processing';

  useEffect(() => {
    deferReactState(() => {
      setIsEditing(false);
    });
  }, [transcription]);

  const handle_edit_start = () => {
    setDraft(transcription);
    setIsEditing(true);
  };

  const handle_save = () => {
    setTranscription(draft);
    setIsEditing(false);
  };

  const handle_cancel = () => {
    setIsEditing(false);
  };

  if (status === 'idle' && !has_content) return null;

  const empty_hint = (): string => {
    if (is_processing) return 'Transcribing audio with AssemblyAI…';
    if (is_done && !has_content) return 'No transcription for this recording.';
    if (capture_mode === 'assemblyai_batch' && (is_recording || is_paused)) {
      return 'Transcription will appear when you stop recording.';
    }
    if (is_recording || is_paused) return 'Speak to see transcription…';
    return 'Speak to see transcription…';
  };

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Transcription</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400">
            {lang_label}
          </span>
          {is_done && !isEditing && transcription && (
            <button
              type="button"
              onClick={handle_edit_start}
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
                onClick={handle_save}
                className="flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                aria-label="Save transcription"
              >
                <Check className="h-3 w-3" />
                Save
              </button>
              <button
                type="button"
                onClick={handle_cancel}
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
            !has_content && 'text-slate-400 dark:text-slate-500 italic',
          )}
          aria-live="polite"
          aria-label="Live transcription"
        >
          {has_content ? (
            <>
              <span className="text-slate-800 dark:text-slate-200">{transcription}</span>
              {interimTranscription && (
                <span className="text-slate-400 dark:text-slate-500 italic"> {interimTranscription}</span>
              )}
            </>
          ) : (
            empty_hint()
          )}
        </div>
      )}
    </div>
  );
};
