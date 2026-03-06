import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { Wand2, Loader2, X } from 'lucide-react';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';
import { improveDocument } from './inline-improvement.service';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  onContentChange: (newContent: string) => void;
  outputLanguage?: 'en' | 'it';
}

const MAX_INSTRUCTION_LENGTH = 500;

export const DocumentImprovementModal = ({
  open,
  onOpenChange,
  content,
  onContentChange,
  outputLanguage = 'en',
}: Props) => {
  const { pushHistory, setFormattedOutput, isGenerating } = useDocumentationStore();

  const [instruction, setInstruction] = useState('');
  const [isImproving, setIsImproving] = useState(false);

  const handleClose = () => {
    if (isImproving) return;
    setInstruction('');
    onOpenChange(false);
  };

  const handleImprove = async () => {
    if (!instruction.trim() || isImproving || isGenerating) return;

    pushHistory(content);
    setIsImproving(true);

    try {
      let improved = '';
      for await (const chunk of improveDocument(content, instruction.trim(), outputLanguage)) {
        improved += chunk;
      }
      onContentChange(improved);
      setFormattedOutput(improved);
      handleClose();
    } catch {
      // silently leave modal open so user can retry
    } finally {
      setIsImproving(false);
    }
  };

  const charCount = instruction.length;
  const busy = isImproving || isGenerating;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && handleClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-xl focus:outline-none"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <Wand2 className="h-4 w-4 text-indigo-500" />
              Improve Document
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                onClick={handleClose}
                disabled={isImproving}
                className="rounded-md p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="relative mb-4">
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value.slice(0, MAX_INSTRUCTION_LENGTH))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleImprove();
              }}
              placeholder="e.g. make this more concise and professional"
              rows={3}
              disabled={busy}
              className="w-full resize-none rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-3 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
              aria-label="Improvement instruction"
              autoFocus
            />
            <span className="absolute bottom-2 right-2 text-xs text-slate-400">
              {charCount}/{MAX_INSTRUCTION_LENGTH}
            </span>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={handleClose}
              disabled={isImproving}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImprove}
              disabled={!instruction.trim() || busy}
              className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              aria-label="Apply document improvement"
            >
              {isImproving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Improving…
                </>
              ) : (
                <>
                  <Wand2 className="h-3.5 w-3.5" />
                  Improve
                </>
              )}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
