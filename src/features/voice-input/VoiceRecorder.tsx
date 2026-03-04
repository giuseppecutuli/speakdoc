import { useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Square, Pause, Play } from 'lucide-react';
import { useRecordingStore } from '@/hooks/useRecordingStore';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { SpeechProviderManager } from './SpeechProviderManager';
import { WaveformVisualizer } from './waveform-visualizer';
import { cn } from '@/utils/cn';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

export const VoiceRecorder = ({ onTranscriptionComplete }: VoiceRecorderProps) => {
  const { status, transcription, interimTranscription, error, setStatus, appendTranscription, setError, reset } =
    useRecordingStore();
  const { speakingLanguage, lockSession, unlockSession } = useLanguageStore();

  const managerRef = useRef<SpeechProviderManager>(new SpeechProviderManager());
  const visualizerRef = useRef<WaveformVisualizer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopAll = useCallback(() => {
    managerRef.current.stop();
    visualizerRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    unlockSession();
  }, [unlockSession]);

  useEffect(() => () => stopAll(), [stopAll]);

  const handleStart = async () => {
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

  return (
    <div className="flex flex-col gap-4">
      {/* Waveform */}
      <div
        className={cn(
          'relative h-16 w-full overflow-hidden rounded-lg bg-slate-100',
          isRecording && 'bg-indigo-50',
        )}
      >
        <canvas ref={canvasRef} className="h-full w-full" />
        {!isRecording && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">
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
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            aria-label="New recording"
          >
            <MicOff className="h-4 w-4" />
            New Recording
          </button>
        )}

        {isRecording && (
          <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Recording
          </span>
        )}
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {/* Live transcription preview */}
      {(transcription || interimTranscription) && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          {transcription}
          {interimTranscription && (
            <span className="text-slate-400 italic"> {interimTranscription}</span>
          )}
        </div>
      )}
    </div>
  );
};
