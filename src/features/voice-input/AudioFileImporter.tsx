import { useRef, useState } from 'react';
import { Upload, AlertCircle, RefreshCw, FileAudio } from 'lucide-react';
import { AssemblyAIService } from './assemblyai.service';
import { useRecordingStore } from '@/hooks/useRecordingStore';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { STORAGE_KEYS } from '@/constants/config';
import { loadAssemblyAiModelFromStorage } from '@/constants/assemblyai-config';

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

const loadAssemblyAIKey = (): string =>
  localStorage.getItem(STORAGE_KEYS.ASSEMBLYAI_API_KEY) ?? '';

type Phase = 'idle' | 'transcribing';

export const AudioFileImporter = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const serviceRef = useRef(new AssemblyAIService());
  const { appendSegmentBlock, setStatus } = useRecordingStore();
  const { speakingLanguage } = useLanguageStore();
  const [phase, setPhase] = useState<Phase>('idle');
  const [localError, setLocalError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);

  const apiKey = loadAssemblyAIKey();
  const isConfigured = apiKey.length > 0;

  const transcribeFile = async (file: File) => {
    const key = loadAssemblyAIKey();
    if (!key) {
      setLocalError('AssemblyAI API key not set. Please configure it in Settings.');
      return;
    }

    setLocalError(null);

    try {
      serviceRef.current.configure(key);
      setPhase('transcribing');

      const model = loadAssemblyAiModelFromStorage();
      const text = await serviceRef.current.transcribe(file, speakingLanguage, model);

      appendSegmentBlock(text);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transcription failed';
      setLocalError(message);
      setStatus('idle');
    } finally {
      setPhase('idle');
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
  const buttonLabel = phase === 'transcribing' ? 'Transcribing…' : 'Import Audio File';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div title={!isConfigured ? 'Set your AssemblyAI API key in Settings to use file import' : undefined}>
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

      {phase === 'transcribing' && (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">Processing audio via AssemblyAI…</p>
      )}

      {localError && (
        <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {localError}
        </p>
      )}

      {!isConfigured && !localError && (
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          AssemblyAI API key not configured — set it in Settings to use file import.
        </p>
      )}
    </div>
  );
};
