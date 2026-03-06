import { useRef, useEffect, useCallback, useState } from 'react';
import { Mic, MicOff, Square, Pause, Play } from 'lucide-react';
import { useRecordingStore } from '@/hooks/useRecordingStore';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { SpeechProviderManager } from './SpeechProviderManager';
import { WaveformVisualizer } from './waveform-visualizer';
import { cn } from '@/utils/cn';
import { createAudioUrl, revokeAudioUrl } from '@/utils/audio-url';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

export const VoiceRecorder = ({ onTranscriptionComplete }: VoiceRecorderProps) => {
  const { status, transcription, interimTranscription, audioBlob, error, setStatus, appendTranscription, setAudioBlob, setError, reset } =
    useRecordingStore();
  const { speakingLanguage, lockSession, unlockSession } = useLanguageStore();

  const [elapsed, setElapsed] = useState(0);

  const managerRef = useRef<SpeechProviderManager>(new SpeechProviderManager());
  const visualizerRef = useRef<WaveformVisualizer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioUrlRef = useRef<string | null>(null);

  const stopMediaRecorder = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const stopAll = useCallback(() => {
    stopMediaRecorder();
    managerRef.current.stop();
    visualizerRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    unlockSession();
  }, [stopMediaRecorder, unlockSession]);

  useEffect(() => {
    return () => {
      stopAll();
      if (audioUrlRef.current) {
        revokeAudioUrl(audioUrlRef.current);
        audioUrlRef.current = null;
      }
    };
  }, [stopAll]);

  useEffect(() => {
    if (status !== 'recording') return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  const formatElapsed = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStart = async () => {
    if (audioUrlRef.current) {
      revokeAudioUrl(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    setElapsed(0);
    reset();
    setError(null);

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
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
      };
      mediaRecorder.start();

      managerRef.current.start(speakingLanguage, {
        onResult: ({ transcript, isFinal }) => appendTranscription(transcript, isFinal),
        onError: (err) => setError(err),
        onEnd: () => {},
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone access denied');
      setStatus('idle');
    }
  };

  const handlePause = () => {
    managerRef.current.stop();
    visualizerRef.current?.stop();
    setStatus('paused');
  };

  const handleResume = async () => {
    setStatus('recording');
    if (streamRef.current && canvasRef.current) {
      const visualizer = new WaveformVisualizer();
      visualizerRef.current = visualizer;
      await visualizer.connect(streamRef.current);
      visualizer.draw(canvasRef.current);
    }
    managerRef.current.start(speakingLanguage, {
      onResult: ({ transcript, isFinal }) => appendTranscription(transcript, isFinal),
      onError: (err) => setError(err),
      onEnd: () => {},
    });
  };

  const handleStop = () => {
    stopAll();
    setStatus('done');
    const final = useRecordingStore.getState().transcription;
    if (final) onTranscriptionComplete(final);
  };

  const isIdle = status === 'idle';
  const isRecording = status === 'recording';
  const isPaused = status === 'paused';
  const isDone = status === 'done';

  useKeyboardShortcuts({
    onSpaceToggle: useCallback(() => {
      if (isIdle) handleStart();
      else if (isRecording || isPaused) handleStop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isIdle, isRecording, isPaused]),
  });

  // Create object URL for audio playback when blob is available
  if (isDone && audioBlob && !audioUrlRef.current) {
    audioUrlRef.current = createAudioUrl(audioBlob);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Waveform */}
      <div
        className={cn(
          'relative h-16 w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700',
          isRecording && 'bg-indigo-50 dark:bg-indigo-900/30',
        )}
      >
        <canvas ref={canvasRef} className="h-full w-full" />
        {!isRecording && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
            {isIdle ? 'Press record to start' : isPaused ? 'Paused' : isDone ? 'Recording complete' : ''}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {isIdle && (
          <button
            onClick={handleStart}
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
              onClick={handleStop}
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
              onClick={handleResume}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              aria-label="Resume recording"
            >
              <Play className="h-4 w-4" />
              Resume
            </button>
            <button
              onClick={handleStop}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              aria-label="Stop recording"
            >
              <Square className="h-4 w-4" />
              Stop
            </button>
          </>
        )}

        {isDone && (
          <button
            onClick={() => { reset(); unlockSession(); }}
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
            Recording · {formatElapsed(elapsed)}
          </span>
        )}
      </div>

      {isDone && audioUrlRef.current && (
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

      {/* Live transcription preview */}
      {(transcription || interimTranscription) && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3 text-sm text-slate-700 dark:text-slate-300">
          {transcription}
          {interimTranscription && (
            <span className="text-slate-400 dark:text-slate-500 italic"> {interimTranscription}</span>
          )}
        </div>
      )}
    </div>
  );
};
