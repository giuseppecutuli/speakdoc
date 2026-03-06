import { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Download, Trash2 } from 'lucide-react';
import { loadAIConfig, saveAIConfig } from '@/features/ai-integration/external-api.service';
import { isGeminiNanoAvailable } from '@/features/ai-integration/gemini-nano.service';
import { BackendBadge } from '@/features/ai-integration/BackendBadge';
import { GeminiNanoGuide } from '@/features/ai-integration/GeminiNanoGuide';
import { WhisperModelSection } from '@/features/voice-input/WhisperModelSection';
import type { AIBackend } from '@/types/ai';
import { STORAGE_KEYS } from '@/constants/config';
import type { SpeechProviderName } from '@/features/voice-input/types/speech-provider';
import { sessionRepository, feedbackRepository } from '@/utils/repositories';

type SpeechPreference = 'auto' | SpeechProviderName;

const PROVIDER_OPTIONS: { value: SpeechPreference; label: string; description: string }[] = [
  { value: 'auto', label: 'Auto', description: 'Use Web Speech API when available, fall back to Whisper' },
  { value: 'web-speech', label: 'Web Speech API', description: 'Browser built-in — online, real-time' },
  { value: 'whisper', label: 'Whisper (offline)', description: 'Local WASM model — works without internet' },
];

const loadSpeechPreference = (): SpeechPreference =>
  (localStorage.getItem(STORAGE_KEYS.SPEECH_PROVIDER) as SpeechPreference) ?? 'auto';

const saveSpeechPreference = (value: SpeechPreference) =>
  localStorage.setItem(STORAGE_KEYS.SPEECH_PROVIDER, value);

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
  const [clearState, setClearState] = useState<'idle' | 'clearing' | 'cleared'>('idle');

  useEffect(() => {
    const config = loadAIConfig();
    setEndpoint(config.apiEndpoint);
    setApiKey(config.apiKey);
    setModel(config.model);
    setSpeechPreference(loadSpeechPreference());
    isGeminiNanoAvailable().then((available) => {
      setActiveBackend(available ? 'gemini-nano' : config.apiEndpoint ? 'external-api' : 'none');
    });
  }, []);

  const handleSpeechPreferenceChange = (value: SpeechPreference) => {
    setSpeechPreference(value);
    saveSpeechPreference(value);
  };

  const handleSave = () => {
    saveAIConfig({ apiEndpoint: endpoint, apiKey, model });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportData = async () => {
    const sessions = await sessionRepository.getAll();
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
      await Promise.all([sessionRepository.clear(), feedbackRepository.clear()]);
      setClearState('cleared');
      setTimeout(() => setClearState('idle'), 2000);
    } catch {
      setClearState('idle');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Back to app"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-base font-semibold text-slate-900">Settings</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        {/* Speech Recognition */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Speech Recognition</h2>
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
          {(speechPreference === 'whisper' || speechPreference === 'auto') && <WhisperModelSection />}
        </section>

        {/* AI Backend */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">AI Backend</h2>
          <div>
            <p className="mb-2 text-xs text-slate-500">Currently active backend:</p>
            <BackendBadge backend={activeBackend} />
          </div>
          <GeminiNanoGuide defaultOpen={activeBackend !== 'gemini-nano'} />
        </section>

        {/* External API */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">External API (Fallback)</h2>
          <p className="text-xs text-slate-500">
            Configure an OpenAI-compatible API. Default: LM Studio on localhost.
          </p>
          <div className="space-y-3">
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
              <p className="text-xs text-amber-700">API keys are stored only in your browser's localStorage.</p>
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
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-700">Data Management</h2>
          <div className="flex gap-2">
            <button
              onClick={handleExportData}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-300 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              aria-label="Export learning data"
              data-testid="export-data"
            >
              <Download className="h-3.5 w-3.5" />
              Export Data
            </button>
            <button
              onClick={handleClearData}
              disabled={clearState === 'clearing'}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              aria-label="Clear all data"
              data-testid="clear-data"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {clearState === 'clearing' ? 'Clearing…' : clearState === 'cleared' ? 'Cleared!' : 'Clear All Data'}
            </button>
          </div>
          <p className="text-xs text-slate-400">Sessions older than 90 days are removed automatically.</p>
        </section>
      </main>
    </div>
  );
};
