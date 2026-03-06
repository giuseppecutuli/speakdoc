import { useRef, useState } from 'react';
import { Upload, AlertCircle, RefreshCw } from 'lucide-react';
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

export const AudioFileImporter = ({ onTranscriptionComplete }: AudioFileImporterProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const serviceRef = useRef(new WhisperService());
  const { setStatus, appendTranscription, setError, reset } = useRecordingStore();
  const [transcribing, setTranscribing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);

  const modelSize = loadWhisperModelSize();
  const { modelId } = WHISPER_MODELS[modelSize];
  const isWhisperLoaded = isWhisperModelCached(modelId);

  const transcribeFile = async (file: File) => {
    reset();
    setLocalError(null);
    setTranscribing(true);
    setStatus('recording');

    try {
      if (!serviceRef.current.isLoaded()) {
        await serviceRef.current.load(modelSize);
      }
      const text = await serviceRef.current.transcribe(file);
      appendTranscription(text, true);
      setStatus('done');
      onTranscriptionComplete(text);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transcription failed';
      setLocalError(message);
      setError(message);
      setStatus('idle');
    } finally {
      setTranscribing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!inputRef.current) return;
    inputRef.current.value = '';

    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setLocalError('File is too large. Maximum size is 50 MB.');
      setError('File is too large. Maximum size is 50 MB.');
      return;
    }

    setLastFile(file);
    await transcribeFile(file);
  };

  const handleRetry = () => {
    if (lastFile) transcribeFile(lastFile);
  };

  const tooltip = !isWhisperLoaded
    ? 'Audio file import requires the Whisper model. Load it in Settings first.'
    : undefined;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div title={tooltip}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={transcribing}
            className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Import audio file"
            data-testid="import-audio-button"
          >
            <Upload className="h-4 w-4" />
            {transcribing ? 'Transcribing…' : 'Import Audio File'}
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

        {localError && lastFile && !transcribing && (
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center gap-1.5 rounded-lg border border-red-300 dark:border-red-700 px-3 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            aria-label="Retry transcription"
            data-testid="retry-transcription-button"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        )}
      </div>

      {localError && (
        <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400" role="alert">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {localError}
        </p>
      )}

      {!isWhisperLoaded && !localError && (
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          Whisper model not loaded — open Settings to download it first.
        </p>
      )}
    </div>
  );
};
