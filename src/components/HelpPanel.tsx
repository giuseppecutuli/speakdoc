import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Keyboard, Languages, Mic } from 'lucide-react';
import { cn } from '@/utils/cn';

const STEPS = [
  'Select your speaking and output languages',
  'Press Record (or Space) to start speaking',
  'Stop recording, then Generate Documentation',
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

interface HelpPanelProps {
  /** Right sidebar: tighter padding to match other rail panels */
  compact?: boolean;
}

export const HelpPanel = ({ compact = false }: HelpPanelProps) => {
  const [open, setOpen] = useState(false);

  const chevron_icon_class = cn('shrink-0 text-slate-400', {
    'h-3.5 w-3.5': compact,
    'h-4 w-4': !compact,
  });

  const table_cell_pad = cn({
    'px-1 py-1': compact,
    'px-3 py-1.5': !compact,
  });

  const table_cell_pad_first_col = cn({
    'px-1.5 py-1': compact,
    'px-3 py-1.5': !compact,
  });

  return (
    <div
      data-quick-guide
      className={cn(
        'rounded-xl border bg-white dark:bg-slate-800 shadow-sm',
        {
          'border-slate-200/70 dark:border-slate-700/80 shadow-none dark:bg-slate-800/90': compact,
          'border-slate-200 dark:border-slate-700': !compact,
        },
      )}
    >
      <button
        type="button"
        className={cn('flex w-full items-center justify-between text-left', {
          'px-3 py-2.5': compact,
          'px-4 py-3': !compact,
        })}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Toggle quick guide"
      >
        <div className="flex items-center gap-2">
          <HelpCircle
            className={cn('shrink-0 text-indigo-500', {
              'h-3.5 w-3.5': compact,
              'h-4 w-4': !compact,
            })}
            aria-hidden
          />
          <span
            className={cn({
              'text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400': compact,
              'text-sm font-semibold text-slate-700 dark:text-slate-200': !compact,
            })}
          >
            Quick Guide
          </span>
        </div>
        {open ? (
          <ChevronUp className={chevron_icon_class} aria-hidden />
        ) : (
          <ChevronDown className={chevron_icon_class} aria-hidden />
        )}
      </button>

      {open && (
        <div
          className={cn('border-t border-slate-200 dark:border-slate-700 space-y-5', {
            'px-3 pb-3 pt-2 space-y-4': compact,
            'px-4 pb-4 pt-3': !compact,
          })}
        >
          {/* How to use */}
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <Mic className="h-3.5 w-3.5" />
              How to use
            </h3>
            <ol className="space-y-1.5 list-none">
              {STEPS.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Keyboard shortcuts */}
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <Keyboard className="h-3.5 w-3.5" />
              Keyboard Shortcuts
            </h3>
            <div className="space-y-1.5">
              {SHORTCUTS.map(({ key, description }) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300">{description}</span>
                  <kbd className="rounded border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Language accuracy */}
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <Languages className="h-3.5 w-3.5" />
              Speech Accuracy by Provider
            </h3>
            <div
              className={cn(
                'overflow-hidden rounded-md border border-slate-200 dark:border-slate-700 text-xs',
                { 'text-[11px]': compact },
              )}
            >
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                    <th className={cn('text-left font-medium text-slate-500 dark:text-slate-400', table_cell_pad_first_col)}>
                      Language
                    </th>
                    <th className={cn('text-center font-medium text-slate-500 dark:text-slate-400', table_cell_pad)}>
                      Web Speech
                    </th>
                    <th className={cn('text-center font-medium text-slate-500 dark:text-slate-400', table_cell_pad)}>
                      AssemblyAI
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ACCURACY.map(({ language, webSpeech, assemblyAI }) => (
                    <tr
                      key={language}
                      className="border-b last:border-0 border-slate-100 dark:border-slate-700"
                    >
                      <td className={cn('text-slate-700 dark:text-slate-200', table_cell_pad_first_col)}>{language}</td>
                      <td className={cn('text-center text-slate-500 dark:text-slate-400', table_cell_pad)}>
                        {webSpeech}
                      </td>
                      <td className={cn('text-center font-semibold text-green-600 dark:text-green-400', table_cell_pad)}>
                        {assemblyAI}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
