import { Sparkles } from 'lucide-react';
import { useRecordingStore } from '@/hooks/useRecordingStore';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';

interface GenerateDocumentationCtaProps {
  onGenerate: (transcription: string) => void;
}

/**
 * Explicit action to run AI doc generation from the current transcription.
 * Transcription flows never call the AI layer until the user clicks this.
 */
export const GenerateDocumentationCta = ({ onGenerate }: GenerateDocumentationCtaProps) => {
  const { transcription, status } = useRecordingStore();
  const isGenerating = useDocumentationStore((s) => s.isGenerating);

  const trimmed_text = transcription.trim();
  const is_busy_capture =
    status === 'recording' || status === 'paused' || status === 'processing';
  const can_run = trimmed_text.length > 0 && !is_busy_capture && !isGenerating;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 p-4">
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
        When the transcription is ready, generate documentation here. AI runs only after you confirm.
      </p>
      <button
        type="button"
        disabled={!can_run}
        onClick={() => onGenerate(trimmed_text)}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        aria-label="Generate documentation from transcription"
      >
        <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
        Generate documentation
      </button>
    </div>
  );
};
