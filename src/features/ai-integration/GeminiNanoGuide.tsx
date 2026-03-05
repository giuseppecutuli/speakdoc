import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

export const FLAG_STEPS = [
  {
    label: 'Open Prompt API flag',
    flag: 'chrome://flags/#prompt-api-for-gemini-nano',
    action: 'Set to Enabled',
  },
  {
    label: 'Open On-Device Model flag',
    flag: 'chrome://flags/#optimization-guide-on-device-model',
    action: 'Set to Enabled BypassPerfRequirement',
  },
];

interface Props {
  defaultOpen: boolean;
}

export const GeminiNanoGuide = ({ defaultOpen }: Props) => {
  const [expanded, setExpanded] = useState(defaultOpen);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => undefined);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="rounded-md border border-slate-200 bg-slate-50">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
        aria-expanded={expanded}
      >
        <span className="text-sm font-medium text-slate-700">How to enable Gemini Nano</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-200 px-3 pb-3 pt-2 space-y-3">
          <p className="text-xs text-slate-500">
            Gemini Nano runs entirely in Chrome — no API key needed. Requires{' '}
            <strong>Chrome 127+</strong> on desktop.
          </p>

          <ol className="space-y-2">
            {FLAG_STEPS.map((step, i) => (
              <li key={step.flag} className="space-y-1">
                <p className="text-xs font-medium text-slate-600">
                  {i + 1}. {step.label}
                </p>
                <div className="flex items-center gap-1.5">
                  <code className="flex-1 truncate rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                    {step.flag}
                  </code>
                  <button
                    onClick={() => handleCopy(step.flag)}
                    className="shrink-0 rounded px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    {copied === step.flag ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-slate-500 pl-1">→ {step.action}</p>
              </li>
            ))}

            <li className="text-xs text-slate-600">
              3. Click <strong>Relaunch</strong> to restart Chrome.
            </li>
            <li className="space-y-1">
              <p className="text-xs text-slate-600">
                4. Open{' '}
                <code className="rounded bg-slate-100 px-1 text-xs">chrome://components</code> and
                update <strong>Optimization Guide On Device Model</strong>.
              </p>
            </li>
            <li className="text-xs text-slate-600">
              5. Reload this page — the badge above should show{' '}
              <span className="font-medium text-green-700">Gemini Nano</span>.
            </li>
          </ol>

          <div className="flex items-start gap-1.5 rounded-md bg-blue-50 px-2.5 py-2">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-500" />
            <p className="text-xs text-blue-700">
              First use may trigger a model download (~1.5 GB). Subsequent uses are instant.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
