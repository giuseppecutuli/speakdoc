import { useRef, useState } from 'react';
import { Upload, AlertCircle, RefreshCw, FileAudio } from 'lucide-react';

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
import { WhisperService } from './whisper.service';
import { useRecordingStore } from '@/hooks/useRecordingStore';
import { WHISPER_MODELS, DEFAULT_WHISPER_MODEL_SIZE, type WhisperModelSize } from '@/constants/whisper-config';
import { STORAGE_KEYS } from '@/constants/config';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

const loadWhisperModelSize = (): WhisperModelSize =>
  (localStorage.getItem(STORAGE_KEYS.WHISPER_MODEL_SIZE) as WhisperModelSize) ?? DEFAULT_WHISPER_MODEL_SIZE;

const whisperLoadedKey = (modelId: string) => `speak-doc:whisper-loaded:${modelId}`;
const isWhisperModelCached = (modelId: string) => localStorage.getItem(whisperLoadedKey(modelId)) === '1';

interface AudioFileImporterProps {
  onTranscriptionComplete: (text: string) => void;
}

type Phase = 'idle' | 'loading' | 'transcribing';

export const AudioFileImporter = ({ onTranscriptionComplete }: AudioFileImporterProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const serviceRef = useRef(new WhisperService());
  const { appendTranscription, reset, setStatus } = useRecordingStore();
  const [phase, setPhase] = useState<Phase>('idle');
  const [loadProgress, setLoadProgress] = useState(0);
  const [localError, setLocalError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [liveText, setLiveText] = useState('');

  const modelSize = loadWhisperModelSize();
  const { modelId } = WHISPER_MODELS[modelSize];

  // Reactive — updated after a successful first load within this session
  const [isWhisperLoaded, setIsWhisperLoaded] = useState(
    () => serviceRef.current.isLoaded() || isWhisperModelCached(modelId),
  );

  const transcribeFile = async (file: File) => {
    reset();
    setLocalError(null);
    setLiveText('');

    try {
      if (!serviceRef.current.isLoaded()) {
        setPhase('loading');
        setLoadProgress(0);
        await serviceRef.current.load(modelSize, (pct) =>
          setLoadProgress((prev) => Math.max(prev, Math.round(pct))),
        );
        setIsWhisperLoaded(true);
      }

      setPhase('transcribing');
      const text = await serviceRef.current.transcribe(file, (chunk) => {
        setLiveText((prev) => (prev ? `${prev} ${chunk}` : chunk));
      });
      setLiveText('');
      appendTranscription(text, true);
      setStatus('done');
      onTranscriptionComplete(text);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transcription failed';
      setLocalError(message);
      setStatus('idle');
    } finally {
      setPhase('idle');
      setLoadProgress(0);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!inputRef.current) return;
    inputRef.current.value = '';

    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLocalError('File is too large. Maximum size is 50 MB.');
      return;
    }

    setLastFile(file);
    await transcribeFile(file);
  };

  const handleRetry = () => {
    if (lastFile) transcribeFile(lastFile);
  };

  const isBusy = phase !== 'idle';
  const buttonLabel =
    phase === 'loading'
      ? `Loading model… ${loadProgress > 0 ? `${loadProgress}%` : ''}`
      : phase === 'transcribing'
        ? 'Transcribing…'
        : 'Import Audio File';

  const tooltip = !isWhisperLoaded
    ? 'Audio file import requires the Whisper model. Load it in Settings first, or it will be downloaded automatically on first import.'
    : undefined;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div title={tooltip}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isBusy}
            className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Import audio file"
            data-testid="import-audio-button"
          >
            {isBusy ? (
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {buttonLabel}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileChange}
            aria-hidden="true"
            data-testid="audio-file-input"
          />
        </div>

        {lastFile && !isBusy && (
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            aria-label="Re-transcribe file"
            data-testid="retry-transcription-button"
          >
            <RefreshCw className="h-4 w-4" />
            Re-transcribe
          </button>
        )}
      </div>

      {lastFile && !isBusy && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2">
          <FileAudio className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
          <span className="truncate text-xs text-slate-700 dark:text-slate-300 font-medium">{lastFile.name}</span>
          <span className="ml-auto shrink-0 text-xs text-slate-400 dark:text-slate-500">{formatFileSize(lastFile.size)}</span>
        </div>
      )}

      {phase === 'loading' && loadProgress > 0 && (
        <div
          className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-300"
            style={{ width: `${loadProgress}%` }}
            role="progressbar"
            aria-valuenow={loadProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Loading model: ${loadProgress}%`}
          />
        </div>
      )}

      {phase === 'transcribing' && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
          {liveText ? (
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {liveText}
            </p>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 italic">Processing audio…</p>
          )}
        </div>
      )}

      {localError && (
        <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {localError}
        </p>
      )}

      {!isWhisperLoaded && !localError && (
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          Whisper model not cached — it will be downloaded automatically on first import.
        </p>
      )}
    </div>
  );
};
