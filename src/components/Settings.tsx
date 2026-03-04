import * as Dialog from '@radix-ui/react-dialog';
import { Settings2, X, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { loadAIConfig, saveAIConfig } from '@/features/ai-integration/external-api.service';
import { isGeminiNanoAvailable } from '@/features/ai-integration/gemini-nano.service';
import type { AIBackend } from '@/types/ai';
import { cn } from '@/utils/cn';

const BackendBadge = ({ backend }: { backend: AIBackend }) => {
  const map = {
    'gemini-nano': { label: 'Gemini Nano', icon: CheckCircle, cls: 'text-green-600 bg-green-50' },
    'external-api': { label: 'External API', icon: CheckCircle, cls: 'text-blue-600 bg-blue-50' },
    none: { label: 'No AI backend', icon: XCircle, cls: 'text-red-600 bg-red-50' },
  };
  const { label, icon: Icon, cls } = map[backend];
  return (
    <span className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', cls)}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
};

const FLAG_STEPS = [
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

const GeminiNanoGuide = ({ defaultOpen }: { defaultOpen: boolean }) => {
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

export const SettingsPanel = () => {
  const [open, setOpen] = useState(false);
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [activeBackend, setActiveBackend] = useState<AIBackend>('none');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      const config = loadAIConfig();
      setEndpoint(config.apiEndpoint);
      setApiKey(config.apiKey);
      setModel(config.model);
      isGeminiNanoAvailable().then((available) => {
        setActiveBackend(available ? 'gemini-nano' : config.apiEndpoint ? 'external-api' : 'none');
      });
    }
  }, [open]);

  const handleSave = () => {
    saveAIConfig({ apiEndpoint: endpoint, apiKey, model });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Open settings"
      >
        <Settings2 className="h-4 w-4" />
        Settings
      </button>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
          <Dialog.Content
            className="fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-white p-6 shadow-xl focus:outline-none"
            aria-describedby="settings-desc"
          >
            <div className="mb-6 flex items-center justify-between">
              <Dialog.Title className="text-lg font-semibold text-slate-900">Settings</Dialog.Title>
              <Dialog.Close className="rounded-md p-1 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="mb-2 text-sm font-semibold text-slate-700">Active AI Backend</h4>
                <BackendBadge backend={activeBackend} />
              </div>

              <GeminiNanoGuide defaultOpen={activeBackend !== 'gemini-nano'} />

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700">External API (Fallback)</h4>
                <p id="settings-desc" className="text-xs text-slate-500">
                  Configure an OpenAI-compatible API. Default: LM Studio on localhost.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">API Endpoint</label>
                  <input
                    type="url"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="http://localhost:1234/v1"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">API Key (optional)</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Model</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="local-model"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <p className="text-xs text-amber-700">
                    API keys are stored only in your browser's localStorage.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleSave}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                {saved ? '✓ Saved' : 'Save Settings'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};
