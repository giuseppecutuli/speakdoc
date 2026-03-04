import { useRecordingStore } from '@/hooks/useRecordingStore';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import { cn } from '@/utils/cn';

export const TranscriptionDisplay = () => {
  const { transcription, interimTranscription, status } = useRecordingStore();
  const { speakingLanguage } = useLanguageStore();

  const hasContent = transcription || interimTranscription;
  const langLabel = SUPPORTED_LANGUAGES[speakingLanguage].label;

  if (!hasContent && status === 'idle') return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Transcription</h3>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
          {langLabel}
        </span>
      </div>

      <div
        className={cn(
          'min-h-16 text-sm leading-relaxed',
          !hasContent && 'text-slate-400 italic',
        )}
        aria-live="polite"
        aria-label="Live transcription"
      >
        {hasContent ? (
          <>
            <span className="text-slate-800">{transcription}</span>
            {interimTranscription && (
              <span className="text-slate-400 italic"> {interimTranscription}</span>
            )}
          </>
        ) : (
          'Speak to see transcription…'
        )}
      </div>
    </div>
  );
};
