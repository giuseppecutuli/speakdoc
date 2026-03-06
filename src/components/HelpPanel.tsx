import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Keyboard, Languages, Mic } from 'lucide-react';

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

const ACCURACY = [
  { language: 'English', webSpeech: '~85%', whisper: '~97%' },
  { language: 'Italian', webSpeech: '~80%', whisper: '~95%' },
];

export const HelpPanel = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Toggle quick guide"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-indigo-500" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Quick Guide</span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {open && (
        <div className="border-t border-slate-200 dark:border-slate-700 px-4 pb-4 pt-3 space-y-5">
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
            <div className="overflow-hidden rounded-md border border-slate-200 dark:border-slate-700 text-xs">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                    <th className="px-3 py-1.5 text-left font-medium text-slate-500 dark:text-slate-400">Language</th>
                    <th className="px-3 py-1.5 text-center font-medium text-slate-500 dark:text-slate-400">Web Speech</th>
                    <th className="px-3 py-1.5 text-center font-medium text-slate-500 dark:text-slate-400">Whisper</th>
                  </tr>
                </thead>
                <tbody>
                  {ACCURACY.map(({ language, webSpeech, whisper }) => (
                    <tr
                      key={language}
                      className="border-b last:border-0 border-slate-100 dark:border-slate-700"
                    >
                      <td className="px-3 py-1.5 text-slate-700 dark:text-slate-200">{language}</td>
                      <td className="px-3 py-1.5 text-center text-slate-500 dark:text-slate-400">{webSpeech}</td>
                      <td className="px-3 py-1.5 text-center font-semibold text-green-600 dark:text-green-400">{whisper}</td>
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
