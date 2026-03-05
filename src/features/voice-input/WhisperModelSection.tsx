import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, Download, Loader2 } from 'lucide-react';
import { WHISPER_MODELS, DEFAULT_WHISPER_MODEL_SIZE, type WhisperModelSize } from '@/constants/whisper-config';
import { WhisperService } from './whisper.service';
import { STORAGE_KEYS } from '@/constants/config';

type WhisperLoadState = 'idle' | 'loading' | 'loaded' | 'error';

const loadWhisperModelSize = (): WhisperModelSize =>
  (localStorage.getItem(STORAGE_KEYS.WHISPER_MODEL_SIZE) as WhisperModelSize) ?? DEFAULT_WHISPER_MODEL_SIZE;

const saveWhisperModelSize = (value: WhisperModelSize) =>
  localStorage.setItem(STORAGE_KEYS.WHISPER_MODEL_SIZE, value);

const whisperLoadedKey = (modelId: string) => `speak-doc:whisper-loaded:${modelId}`;
const isWhisperModelCached = (modelId: string) => localStorage.getItem(whisperLoadedKey(modelId)) === '1';
const markWhisperModelCached = (modelId: string) => localStorage.setItem(whisperLoadedKey(modelId), '1');

export const WhisperModelSection = () => {
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
