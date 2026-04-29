import { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Download, Trash2, Eye, EyeOff } from 'lucide-react';
import { loadAIConfig, saveAIConfig } from '@/features/ai-integration/external-api.service';
import { isGeminiNanoAvailable } from '@/features/ai-integration/gemini-nano.service';
import { BackendBadge } from '@/features/ai-integration/BackendBadge';
import { GeminiNanoGuide } from '@/features/ai-integration/GeminiNanoGuide';
import { AssemblyAIGuide } from '@/components/AssemblyAIGuide';
import type { AIBackend } from '@/types/ai';
import { STORAGE_KEYS } from '@/constants/config';
import {
  loadSpeechPreference,
  saveSpeechPreference,
  type SpeechPreference,
} from '@/features/voice-input/speech-preference';
import { ASSEMBLYAI_MODELS, DEFAULT_ASSEMBLYAI_MODEL, type AssemblyAIModel } from '@/constants/assemblyai-config';
import { sessionRepository, feedbackRepository, draftRepository } from '@/utils/repositories';
import { deferReactState } from '@/utils/defer-react-state';
import { stripSessionAudioForExport } from '@/features/learning/session-export';

const PROVIDER_OPTIONS: { value: SpeechPreference; label: string; description: string }[] = [
  {
    value: 'auto',
    label: 'Auto',
    description: 'Prefer browser speech-to-text; if unavailable, record audio and transcribe with AssemblyAI after stop',
  },
  {
    value: 'web-speech',
    label: 'Web Speech API',
    description: 'Browser built-in — real-time transcription while you speak',
  },
  {
    value: 'assemblyai-batch',
    label: 'AssemblyAI (after recording)',
    description: 'Record audio only; high-accuracy transcription when you press Stop (requires API key)',
  },
];

const loadAssemblyAIKey = (): string =>
  localStorage.getItem(STORAGE_KEYS.ASSEMBLYAI_API_KEY) ?? '';

const saveAssemblyAIKey = (key: string) =>
  localStorage.setItem(STORAGE_KEYS.ASSEMBLYAI_API_KEY, key);

const loadAssemblyAIModel = (): AssemblyAIModel =>
  (localStorage.getItem(STORAGE_KEYS.ASSEMBLYAI_MODEL) as AssemblyAIModel) ?? DEFAULT_ASSEMBLYAI_MODEL;

const saveAssemblyAIModel = (model: AssemblyAIModel) =>
  localStorage.setItem(STORAGE_KEYS.ASSEMBLYAI_MODEL, model);

interface SettingsPageProps {
  onBack: () => void;
}

export const SettingsPage = ({ onBack }: SettingsPageProps) => {
  const [endpoint, setEndpoint] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [activeBackend, setActiveBackend] = useState<AIBackend>('none');
  const [saved, setSaved] = useState(false);
  const [speechPreference, setSpeechPreference] = useState<SpeechPreference>(loadSpeechPreference);
  const [assemblyAIKey, setAssemblyAIKey] = useState(loadAssemblyAIKey);
  const [assemblyAIModel, setAssemblyAIModel] = useState<AssemblyAIModel>(loadAssemblyAIModel);
  const [showAssemblyAIKey, setShowAssemblyAIKey] = useState(false);
  const [assemblyAISaved, setAssemblyAISaved] = useState(false);
  const [clearState, setClearState] = useState<'idle' | 'clearing' | 'cleared'>('idle');

  useEffect(() => {
    const config = loadAIConfig();
    deferReactState(() => {
      setEndpoint(config.apiEndpoint);
      setApiKey(config.apiKey);
      setModel(config.model);
      setSpeechPreference(loadSpeechPreference());
    });
    isGeminiNanoAvailable().then((available) => {
      setActiveBackend(available ? 'gemini-nano' : config.apiEndpoint ? 'external-api' : 'none');
    });
  }, []);

  const handleSpeechPreferenceChange = (value: SpeechPreference) => {
    setSpeechPreference(value);
    saveSpeechPreference(value);
  };

  const handleAssemblyAISave = () => {
    saveAssemblyAIKey(assemblyAIKey.trim());
    saveAssemblyAIModel(assemblyAIModel);
    setAssemblyAISaved(true);
    setTimeout(() => setAssemblyAISaved(false), 2000);
  };

  const handleSave = () => {
    saveAIConfig({ apiEndpoint: endpoint, apiKey, model });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportData = async () => {
    const sessions_raw = await sessionRepository.getAll();
    const sessions = sessions_raw.map(stripSessionAudioForExport);
    const payload = { sessions, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `speak-doc-data-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleClearData = async () => {
    setClearState('clearing');
    try {
      await Promise.all([sessionRepository.clear(), feedbackRepository.clear(), draftRepository.clear()]);
      setClearState('cleared');
      setTimeout(() => setClearState('idle'), 2000);
    } catch {
      setClearState('idle');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Back to app"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100">Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Speech Recognition */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Speech Recognition</h2>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Provider</label>
            <select
              value={speechPreference}
              onChange={(e) => handleSpeechPreferenceChange(e.target.value as SpeechPreference)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {PROVIDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {PROVIDER_OPTIONS.find((o) => o.value === speechPreference)?.description}
            </p>
          </div>
        </section>

        {/* AssemblyAI Configuration */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">AssemblyAI Configuration</h2>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">API Key</label>
            <div className="relative">
              <input
                type={showAssemblyAIKey ? 'text' : 'password'}
                value={assemblyAIKey}
                onChange={(e) => setAssemblyAIKey(e.target.value)}
                placeholder="Enter your AssemblyAI API key"
                className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                data-testid="assemblyai-api-key-input"
              />
              <button
                type="button"
                onClick={() => setShowAssemblyAIKey((v) => !v)}
                className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label={showAssemblyAIKey ? 'Hide API key' : 'Show API key'}
              >
                {showAssemblyAIKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Model</label>
            <select
              value={assemblyAIModel}
              onChange={(e) => setAssemblyAIModel(e.target.value as AssemblyAIModel)}
              className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              data-testid="assemblyai-model-select"
            >
              {ASSEMBLYAI_MODELS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAssemblyAISave}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            data-testid="assemblyai-save-button"
          >
            {assemblyAISaved ? '✓ Saved' : 'Save AssemblyAI Settings'}
          </button>

          <AssemblyAIGuide />
        </section>

        {/* AI Backend */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">AI Backend</h2>
          <div>
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">Currently active backend:</p>
            <BackendBadge backend={activeBackend} />
          </div>
          <GeminiNanoGuide defaultOpen={activeBackend !== 'gemini-nano'} />
        </section>

        {/* External API */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">External API (Fallback)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure an OpenAI-compatible API. Default: LM Studio on localhost.
          </p>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">API Endpoint</label>
              <input
                type="url"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="http://localhost:1234/v1"
                className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">API Key (optional)</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="local-model"
                className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">API keys are stored only in your browser's localStorage.</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            {saved ? '✓ Saved' : 'Save Settings'}
          </button>
        </section>

        {/* Data Management */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Data Management</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Your session history (transcriptions, generated docs, timestamps) is stored locally in your browser's IndexedDB — nothing leaves your device. Exporting downloads a JSON file with all sessions.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleExportData}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              aria-label="Export learning data"
              data-testid="export-data"
            >
              <Download className="h-3.5 w-3.5" />
              Export Data
            </button>
            <button
              onClick={handleClearData}
              disabled={clearState === 'clearing'}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-red-200 dark:border-red-800 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
              aria-label="Clear all data"
              data-testid="clear-data"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {clearState === 'clearing' ? 'Clearing…' : clearState === 'cleared' ? 'Cleared!' : 'Clear All Data'}
            </button>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">Sessions older than 90 days are removed automatically.</p>
        </section>
      </main>
    </div>
  );
};
