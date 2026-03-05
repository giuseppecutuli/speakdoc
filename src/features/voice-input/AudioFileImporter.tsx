import { useRef, useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { WhisperService } from './whisper.service';
import { useRecordingStore } from '@/hooks/useRecordingStore';
import { DEFAULT_WHISPER_MODEL_SIZE } from '@/constants/whisper-config';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

interface AudioFileImporterProps {
  onTranscriptionComplete: (text: string) => void;
}

export const AudioFileImporter = ({ onTranscriptionComplete }: AudioFileImporterProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const serviceRef = useRef(new WhisperService());
  const { setStatus, appendTranscription, setError, reset } = useRecordingStore();
  const [transcribing, setTranscribing] = useState(false);

  const isWhisperLoaded = serviceRef.current.isLoaded();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!inputRef.current) return;
    inputRef.current.value = '';

    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('File is too large. Maximum size is 50 MB.');
      return;
    }

    reset();
    setTranscribing(true);
    setStatus('recording');

    try {
      if (!serviceRef.current.isLoaded()) {
        await serviceRef.current.load(DEFAULT_WHISPER_MODEL_SIZE);
      }
      const text = await serviceRef.current.transcribe(file);
      appendTranscription(text, true);
      setStatus('done');
      onTranscriptionComplete(text);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transcription failed');
      setStatus('idle');
    } finally {
      setTranscribing(false);
    }
  };

  const tooltip = !isWhisperLoaded
    ? 'Audio file import requires the Whisper model. Load it in Settings first.'
    : undefined;

  return (
    <div className="flex flex-col gap-2">
      <div title={tooltip}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={transcribing}
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
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

      {!isWhisperLoaded && (
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          Whisper model not loaded — open Settings to download it first.
        </p>
      )}
    </div>
  );
};
