import * as Dialog from '@radix-ui/react-dialog';
import { Settings2, X, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, Download, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { loadAIConfig, saveAIConfig } from '@/features/ai-integration/external-api.service';
import { isGeminiNanoAvailable } from '@/features/ai-integration/gemini-nano.service';
import type { AIBackend } from '@/types/ai';
import { cn } from '@/utils/cn';
import { STORAGE_KEYS } from '@/constants/config';
import { WHISPER_MODELS, DEFAULT_WHISPER_MODEL_SIZE, type WhisperModelSize } from '@/constants/whisper-config';
import { WhisperService } from '@/features/voice-input/whisper.service';
import type { SpeechProviderName } from '@/features/voice-input/types/speech-provider';

type SpeechPreference = 'auto' | SpeechProviderName;

const loadSpeechPreference = (): SpeechPreference =>
  (localStorage.getItem(STORAGE_KEYS.SPEECH_PROVIDER) as SpeechPreference) ?? 'auto';

const saveSpeechPreference = (value: SpeechPreference) =>
  localStorage.setItem(STORAGE_KEYS.SPEECH_PROVIDER, value);

const loadWhisperModelSize = (): WhisperModelSize =>
  (localStorage.getItem(STORAGE_KEYS.WHISPER_MODEL_SIZE) as WhisperModelSize) ?? DEFAULT_WHISPER_MODEL_SIZE;

const saveWhisperModelSize = (value: WhisperModelSize) =>
  localStorage.setItem(STORAGE_KEYS.WHISPER_MODEL_SIZE, value);

type WhisperLoadState = 'idle' | 'loading' | 'loaded' | 'error';

const whisperLoadedKey = (modelId: string) => `speak-doc:whisper-loaded:${modelId}`;
const isWhisperModelCached = (modelId: string) => localStorage.getItem(whisperLoadedKey(modelId)) === '1';
const markWhisperModelCached = (modelId: string) => localStorage.setItem(whisperLoadedKey(modelId), '1');

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

const PROVIDER_OPTIONS: { value: SpeechPreference; label: string; description: string }[] = [
  { value: 'auto', label: 'Auto', description: 'Use Web Speech API when available, fall back to Whisper' },
  { value: 'web-speech', label: 'Web Speech API', description: 'Browser built-in — online, real-time' },
  { value: 'whisper', label: 'Whisper (offline)', description: 'Local WASM model — works without internet' },
];

const WhisperModelSection = () => {
  const [modelSize, setModelSize] = useState<WhisperModelSize>(loadWhisperModelSize);
  const [loadState, setLoadState] = useState<WhisperLoadState>(() => {
    const { modelId } = WHISPER_MODELS[loadWhisperModelSize()];
    return isWhisperModelCached(modelId) ? 'loaded' : 'idle';
  });
  const [progress, setProgress] = useState(0);
  const serviceRef = useRef<WhisperService | null>(null);

  useEffect(() => {
    serviceRef.current = new WhisperService();
  }, []);

  const handleModelSizeChange = (size: WhisperModelSize) => {
    setModelSize(size);
    saveWhisperModelSize(size);
    const { modelId } = WHISPER_MODELS[size];
    setLoadState(isWhisperModelCached(modelId) ? 'loaded' : 'idle');
    setProgress(0);
  };

  const handleLoad = async () => {
    if (!serviceRef.current) return;
    setLoadState('loading');
    setProgress(0);
    try {
      await serviceRef.current.load(modelSize, (pct) => setProgress((prev) => Math.max(prev, Math.round(pct))));
      markWhisperModelCached(WHISPER_MODELS[modelSize].modelId);
      setLoadState('loaded');
    } catch {
      setLoadState('error');
    }
  };

  return (
    <div className="space-y-3 rounded-md border border-slate-200 p-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600">Model size</label>
        <select
          value={modelSize}
          onChange={(e) => handleModelSizeChange(e.target.value as WhisperModelSize)}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {(Object.keys(WHISPER_MODELS) as WhisperModelSize[]).map((size) => (
            <option key={size} value={size}>
              {WHISPER_MODELS[size].label}
            </option>
          ))}
        </select>
      </div>

      {loadState === 'loading' && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Downloading model…
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {loadState === 'loaded' && (
        <p className="flex items-center gap-1.5 text-xs text-green-600">
          <CheckCircle className="h-3.5 w-3.5" />
          Model loaded — ready for offline use
        </p>
      )}

      {loadState === 'error' && (
        <p className="flex items-center gap-1.5 text-xs text-red-600">
          <XCircle className="h-3.5 w-3.5" />
          Failed to load model. Check your connection and try again.
        </p>
      )}

      {loadState !== 'loaded' && (
        <button
          onClick={handleLoad}
          disabled={loadState === 'loading'}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          <Download className="h-4 w-4" />
          {loadState === 'loading' ? 'Downloading…' : 'Download & Load Model'}
        </button>
      )}

      <p className="text-xs text-slate-400">
        Model is stored in your browser. Downloads only once per device.
      </p>
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
  const [speechPreference, setSpeechPreference] = useState<SpeechPreference>(loadSpeechPreference);

  useEffect(() => {
    if (open) {
      const config = loadAIConfig();
      setEndpoint(config.apiEndpoint);
      setApiKey(config.apiKey);
      setModel(config.model);
      setSpeechPreference(loadSpeechPreference());
      isGeminiNanoAvailable().then((available) => {
        setActiveBackend(available ? 'gemini-nano' : config.apiEndpoint ? 'external-api' : 'none');
      });
    }
  }, [open]);

  const handleSpeechPreferenceChange = (value: SpeechPreference) => {
    setSpeechPreference(value);
    saveSpeechPreference(value);
  };

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
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700">Speech Recognition</h4>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-600">Provider</label>
                  <select
                    value={speechPreference}
                    onChange={(e) => handleSpeechPreferenceChange(e.target.value as SpeechPreference)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {PROVIDER_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400">
                    {PROVIDER_OPTIONS.find((o) => o.value === speechPreference)?.description}
                  </p>
                </div>

                {(speechPreference === 'whisper' || speechPreference === 'auto') && (
                  <WhisperModelSection />
                )}
              </div>

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
