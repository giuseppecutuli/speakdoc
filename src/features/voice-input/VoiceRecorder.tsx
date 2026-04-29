import { useRef, useEffect, useCallback, useState } from 'react';
import { Mic, MicOff, Square, Pause, Play, Download } from 'lucide-react';
import { useRecordingStore } from '@/hooks/useRecordingStore';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { SpeechProviderManager } from './SpeechProviderManager';
import { WaveformVisualizer } from './waveform-visualizer';
import { cn } from '@/utils/cn';
import { createAudioUrl, revokeAudioUrl } from '@/utils/audio-url';
import { resolveVoiceCaptureMode, type VoiceCaptureMode } from './speech-preference';
import { AssemblyAIService } from './assemblyai.service';
import { downloadBlob } from '@/features/export/export.service';
import { draftRepository } from '@/utils/repositories';
import { finalizeMediaRecorderBlob } from '@/utils/media-recorder-blob';
import { formatElapsedMmSs } from '@/utils/datetime-display';
import { VOICE_CAPTURE_UNAVAILABLE } from './voice-recording-messages';
import { startBrowserSttForRecording } from './web-speech-recording';
import { buildLocalRecordingDownloadFilename } from './recording-download-filename';
import {
  assemblyAiBatchPrecheck,
  transcribeMicBlobWithAssemblyAi,
} from './assemblyai-batch-after-mic';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

export const VoiceRecorder = ({ onTranscriptionComplete }: VoiceRecorderProps) => {
  const {
    status,
    audioBlob,
    error,
    setStatus,
    appendTranscription,
    setAudioBlob,
    setCaptureMode,
    setError,
    reset,
    setTranscription,
  } = useRecordingStore();
  const { speakingLanguage, lockSession, unlockSession } = useLanguageStore();

  const [elapsed, setElapsed] = useState(0);

  const managerRef = useRef(new SpeechProviderManager());
  const assemblyServiceRef = useRef(new AssemblyAIService());
  const visualizerRef = useRef<WaveformVisualizer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);
  const captureModeRef = useRef<VoiceCaptureMode | null>(null);

  const stopMediaRecorderOnly = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') {
      mr.stop();
    }
  }, []);

  const stopSpeechAndVisualizer = useCallback(() => {
    managerRef.current.stop();
    visualizerRef.current?.stop();
  }, []);

  const stopStreamTracks = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopSpeechAndVisualizer();
      stopMediaRecorderOnly();
      stopStreamTracks();
      if (audioUrlRef.current) {
        revokeAudioUrl(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, [stopSpeechAndVisualizer, stopMediaRecorderOnly, stopStreamTracks]);

  useEffect(() => {
    if (status !== 'recording') return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  const handleStart = async () => {
    if (audioUrlRef.current) {
      revokeAudioUrl(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setElapsed(0);
    reset();
    setError(null);

    const mode = resolveVoiceCaptureMode();
    if (!mode) {
      setError(VOICE_CAPTURE_UNAVAILABLE);
      setStatus('idle');
      return;
    }

    captureModeRef.current = mode;
    setCaptureMode(mode);
    draftRepository.beginNewDraft();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      lockSession();
      setStatus('recording');

      const visualizer = new WaveformVisualizer();
      visualizerRef.current = visualizer;
      await visualizer.connect(stream);
      if (canvasRef.current) visualizer.draw(canvasRef.current);

      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.start();

      if (mode === 'browser_stt') {
        startBrowserSttForRecording(
          managerRef.current,
          speakingLanguage,
          appendTranscription,
          setError,
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone access denied');
      setStatus('idle');
      setCaptureMode(null);
      captureModeRef.current = null;
    }
  };

  const handlePause = () => {
    const mode = captureModeRef.current;
    if (mode === 'browser_stt') {
      managerRef.current.stop();
    }
    visualizerRef.current?.stop();
    setStatus('paused');
  };

  const handleResume = async () => {
    const mode = captureModeRef.current;
    setStatus('recording');
    if (streamRef.current && canvasRef.current) {
      const visualizer = new WaveformVisualizer();
      visualizerRef.current = visualizer;
      await visualizer.connect(streamRef.current);
      visualizer.draw(canvasRef.current);
    }
    if (mode === 'browser_stt') {
      startBrowserSttForRecording(
        managerRef.current,
        speakingLanguage,
        appendTranscription,
        setError,
      );
    }
  };

  const handleStop = async () => {
    const mode = captureModeRef.current;
    stopSpeechAndVisualizer();
    visualizerRef.current?.stop();

    const mr = mediaRecorderRef.current;
    const chunks = audioChunksRef.current;
    const blob = mr ? await finalizeMediaRecorderBlob(mr, chunks) : null;

    stopStreamTracks();
    mediaRecorderRef.current = null;
    unlockSession();

    if (blob && blob.size > 0) {
      setAudioBlob(blob);
    }

    if (mode === 'assemblyai_batch') {
      const pre = assemblyAiBatchPrecheck(blob);
      if (!pre.ok) {
        setError(pre.message);
        setStatus('idle');
        setCaptureMode(null);
        captureModeRef.current = null;
        return;
      }
      setStatus('processing');
      try {
        const text = await transcribeMicBlobWithAssemblyAi(
          pre.blob,
          pre.apiKey,
          speakingLanguage,
          assemblyServiceRef.current,
        );
        setTranscription(text);
        setStatus('done');
        if (text.trim()) onTranscriptionComplete(text);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Transcription failed');
        setStatus('idle');
      } finally {
        setCaptureMode(null);
        captureModeRef.current = null;
      }
      return;
    }

    setStatus('done');
    setCaptureMode(null);
    captureModeRef.current = null;
    const final = useRecordingStore.getState().transcription;
    if (final.trim()) onTranscriptionComplete(final);
  };

  const handleDownloadAudio = () => {
    const blob = useRecordingStore.getState().audioBlob;
    if (!blob) return;
    downloadBlob(blob, buildLocalRecordingDownloadFilename(blob));
  };

  const isIdle = status === 'idle';
  const isRecording = status === 'recording';
  const isPaused = status === 'paused';
  const isDone = status === 'done';
  const isProcessing = status === 'processing';

  useKeyboardShortcuts({
    onSpaceToggle: useCallback(() => {
      if (isIdle) void handleStart();
      else if (isRecording || isPaused) void handleStop();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isIdle, isRecording, isPaused]),
  });

  if ((isDone || isProcessing) && audioBlob && !audioUrlRef.current) {
    audioUrlRef.current = createAudioUrl(audioBlob);
  }

  let waveformOverlay = '';
  if (isIdle) waveformOverlay = 'Press record to start';
  else if (isPaused) waveformOverlay = 'Paused';
  else if (isProcessing) waveformOverlay = 'Transcribing…';
  else if (isDone) waveformOverlay = 'Recording complete';

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          'relative h-16 w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700',
          isRecording && 'bg-indigo-50 dark:bg-indigo-900/30',
        )}
      >
        <canvas ref={canvasRef} className="h-full w-full" />
        {!isRecording && waveformOverlay && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
            {waveformOverlay}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {isIdle && (
          <button
            onClick={() => void handleStart()}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            aria-label="Start recording"
          >
            <Mic className="h-4 w-4" />
            Record
          </button>
        )}

        {isRecording && (
          <>
            <button
              onClick={handlePause}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
              aria-label="Pause recording"
            >
              <Pause className="h-4 w-4" />
              Pause
            </button>
            <button
              onClick={() => void handleStop()}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              aria-label="Stop recording"
            >
              <Square className="h-4 w-4" />
              Stop
            </button>
          </>
        )}

        {isPaused && (
          <>
            <button
              onClick={() => void handleResume()}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              aria-label="Resume recording"
            >
              <Play className="h-4 w-4" />
              Resume
            </button>
            <button
              onClick={() => void handleStop()}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              aria-label="Stop recording"
            >
              <Square className="h-4 w-4" />
              Stop
            </button>
          </>
        )}

        {isDone && audioBlob && (
          <button
            type="button"
            onClick={handleDownloadAudio}
            className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            aria-label="Download audio recording"
          >
            <Download className="h-4 w-4" />
            Download audio
          </button>
        )}

        {isDone && (
          <button
            onClick={() => {
              reset();
              unlockSession();
              draftRepository.beginNewDraft();
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            aria-label="New recording"
          >
            <MicOff className="h-4 w-4" />
            New Recording
          </button>
        )}

        {isRecording && (
          <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Recording · {formatElapsedMmSs(elapsed)}
          </span>
        )}

        {isProcessing && (
          <span className="text-sm text-slate-600 dark:text-slate-300">Transcribing with AssemblyAI…</span>
        )}
      </div>

      {(isDone || isProcessing) && audioUrlRef.current && (
        <audio
          controls
          src={audioUrlRef.current}
          className="w-full"
          aria-label="Recording playback"
          data-testid="audio-playback"
        />
      )}

      {error && (
        <p className="rounded-md bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
