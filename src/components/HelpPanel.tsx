import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { HelpCircle, Keyboard, Languages, Mic, X } from 'lucide-react';
import { cn } from '@/utils/cn';

const STEPS = [
  'Select your speaking and output languages',
  'Press Record (or Space) to start speaking; you can stop and Record again to append more text',
  'In the right sidebar: Save opens a name dialog; Edit draft name renames the current draft; New session and Clear workspace manage the page',
  'In the left column, Active settings summarizes languages, template, output format, voice capture, and documentation AI — use Open full settings to change them',
  'Click Generate documentation when ready — AI runs only after that',
  'Rename drafts under In progress (pencil); name a finished session via Name session in the doc header or Rename in Session History',
  'Edit the result and copy to Confluence or Notion',
];

const SHORTCUTS = [
  { key: 'Space', description: 'Start / Stop recording' },
  { key: 'Ctrl+S', description: 'Download documentation' },
  { key: 'Esc', description: 'Close modals and popovers' },
];

const ACCURACY: { language: string; webSpeech: string; assemblyAI: string }[] = [
  { language: 'English', webSpeech: '~85%', assemblyAI: '~97%' },
  { language: 'Italian', webSpeech: '~80%', assemblyAI: '~95%' },
];

function QuickGuideModalContent() {
  return (
    <div className="space-y-6 pr-1">
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Mic className="h-4 w-4 shrink-0" aria-hidden />
          How to use
        </h3>
        <ol className="list-none space-y-2">
          {STEPS.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Keyboard className="h-4 w-4 shrink-0" aria-hidden />
          Keyboard shortcuts
        </h3>
        <div className="space-y-2">
          {SHORTCUTS.map(({ key, description }) => (
            <div key={key} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-slate-700 dark:text-slate-200">{description}</span>
              <kbd className="shrink-0 rounded border border-slate-200 bg-slate-100 px-2 py-1 font-mono text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          <Languages className="h-4 w-4 shrink-0" aria-hidden />
          Speech accuracy by provider
        </h3>
        <div className="overflow-hidden rounded-lg border border-slate-200 text-sm dark:border-slate-600">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-700/50">
                <th className="px-4 py-2.5 text-left font-medium text-slate-600 dark:text-slate-300">Language</th>
                <th className="px-4 py-2.5 text-center font-medium text-slate-600 dark:text-slate-300">Web Speech</th>
                <th className="px-4 py-2.5 text-center font-medium text-slate-600 dark:text-slate-300">AssemblyAI</th>
              </tr>
            </thead>
            <tbody>
              {ACCURACY.map(({ language, webSpeech, assemblyAI }) => (
                <tr key={language} className="border-b border-slate-100 last:border-0 dark:border-slate-700">
                  <td className="px-4 py-2.5 text-slate-800 dark:text-slate-100">{language}</td>
                  <td className="px-4 py-2.5 text-center text-slate-600 dark:text-slate-400">{webSpeech}</td>
                  <td className="px-4 py-2.5 text-center font-semibold text-green-600 dark:text-green-400">{assemblyAI}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface HelpPanelProps {
  /** Narrow rail: compact trigger card to match Active settings. */
  compact?: boolean;
}

export const HelpPanel = ({ compact = false }: HelpPanelProps) => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div
        data-quick-guide
        className={cn('rounded-xl border bg-white dark:bg-slate-800 shadow-sm', {
          'border-slate-200/70 dark:border-slate-700/80 shadow-none dark:bg-slate-800/90': compact,
          'border-slate-200 dark:border-slate-700': !compact,
        })}
      >
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-lg font-semibold text-indigo-700 transition-colors hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-950/40',
            compact ? 'px-3 py-2.5 text-xs' : 'px-4 py-3 text-sm',
          )}
          aria-haspopup="dialog"
          aria-expanded={modalOpen}
          aria-controls="quick-guide-dialog"
        >
          <HelpCircle
            className={cn('shrink-0 text-indigo-500', compact ? 'h-4 w-4' : 'h-5 w-5')}
            aria-hidden
          />
          Quick guide
        </button>
      </div>

      <Dialog.Root open={modalOpen} onOpenChange={setModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" />
          <Dialog.Content
            id="quick-guide-dialog"
            className="fixed left-1/2 top-1/2 z-[70] flex max-h-[min(90vh,720px)] w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border border-slate-200 bg-white shadow-xl focus:outline-none dark:border-slate-700 dark:bg-slate-800"
            aria-describedby="quick-guide-description"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <Dialog.Title className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Quick guide
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                  aria-label="Close quick guide"
                >
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Description id="quick-guide-description" className="sr-only">
              Steps to use Speak Doc, keyboard shortcuts, and speech accuracy by language and provider.
            </Dialog.Description>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <QuickGuideModalContent />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};
