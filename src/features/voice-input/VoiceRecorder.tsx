import { useRef, useEffect, useCallback, useState } from 'react';
import { Mic, MicOff, Square, Pause, Play, Download } from 'lucide-react';
import { useRecordingStore } from '@/hooks/useRecordingStore';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { SpeechProviderManager } from './SpeechProviderManager';
import { WaveformVisualizer } from './waveform-visualizer';
import { cn } from '@/utils/cn';
import { createAudioUrl, revokeAudioUrl } from '@/utils/audio-url';
import { resolve_voice_capture_mode, type VoiceCaptureMode } from './speech-preference';
import { AssemblyAIService } from './assemblyai.service';
import { load_assembly_ai_model_from_storage } from '@/constants/assemblyai-config';
import { STORAGE_KEYS } from '@/constants/config';
import { download_blob } from '@/features/export/export.service';
import { draftRepository } from '@/utils/repositories';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
}

function finalize_media_recorder_blob(media_recorder: MediaRecorder, chunks: Blob[]): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (media_recorder.state === 'inactive') {
      const blob =
        chunks.length > 0 ? new Blob(chunks, { type: media_recorder.mimeType || 'audio/webm' }) : null;
      resolve(blob);
      return;
    }
    media_recorder.onstop = () => {
      const blob =
        chunks.length > 0 ? new Blob(chunks, { type: media_recorder.mimeType || 'audio/webm' }) : null;
      resolve(blob);
    };
    media_recorder.stop();
  });
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

  const manager_ref = useRef(new SpeechProviderManager());
  const assembly_service_ref = useRef(new AssemblyAIService());
  const visualizer_ref = useRef<WaveformVisualizer | null>(null);
  const canvas_ref = useRef<HTMLCanvasElement>(null);
  const stream_ref = useRef<MediaStream | null>(null);
  const media_recorder_ref = useRef<MediaRecorder | null>(null);
  const audio_chunks_ref = useRef<Blob[]>([]);
  const audio_url_ref = useRef<string | null>(null);
  const capture_mode_ref = useRef<VoiceCaptureMode | null>(null);

  const stop_media_recorder_only = useCallback(() => {
    const mr = media_recorder_ref.current;
    if (mr && mr.state !== 'inactive') {
      mr.stop();
    }
  }, []);

  const stop_speech_and_visualizer = useCallback(() => {
    manager_ref.current.stop();
    visualizer_ref.current?.stop();
  }, []);

  const stop_stream_tracks = useCallback(() => {
    stream_ref.current?.getTracks().forEach((t) => t.stop());
    stream_ref.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stop_speech_and_visualizer();
      stop_media_recorder_only();
      stop_stream_tracks();
      if (audio_url_ref.current) {
        revokeAudioUrl(audio_url_ref.current);
        audio_url_ref.current = null;
      }
    };
  }, [stop_speech_and_visualizer, stop_media_recorder_only, stop_stream_tracks]);

  useEffect(() => {
    if (status !== 'recording') return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [status]);

  const format_elapsed = (seconds: number): string => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handle_start = async () => {
    if (audio_url_ref.current) {
      revokeAudioUrl(audio_url_ref.current);
      audio_url_ref.current = null;
    }
    setElapsed(0);
    reset();
    setError(null);

    const mode = resolve_voice_capture_mode();
    if (!mode) {
      setError(
        'No speech capture available. Enable Web Speech in a supported browser or add an AssemblyAI API key and choose AssemblyAI (after recording) in Settings.',
      );
      setStatus('idle');
      return;
    }

    capture_mode_ref.current = mode;
    setCaptureMode(mode);
    draftRepository.begin_new_draft();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream_ref.current = stream;
      lockSession();
      setStatus('recording');

      const visualizer = new WaveformVisualizer();
      visualizer_ref.current = visualizer;
      await visualizer.connect(stream);
      if (canvas_ref.current) visualizer.draw(canvas_ref.current);

      audio_chunks_ref.current = [];
      const media_recorder = new MediaRecorder(stream);
      media_recorder_ref.current = media_recorder;
      media_recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audio_chunks_ref.current.push(e.data);
      };
      media_recorder.start();

      if (mode === 'browser_stt') {
        manager_ref.current.start(
          speakingLanguage,
          {
            onResult: ({ transcript, isFinal }) => appendTranscription(transcript, isFinal),
            onError: (err) => setError(err),
            onEnd: () => {},
          },
          'web-speech',
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone access denied');
      setStatus('idle');
      setCaptureMode(null);
      capture_mode_ref.current = null;
    }
  };

  const handle_pause = () => {
    const mode = capture_mode_ref.current;
    if (mode === 'browser_stt') {
      manager_ref.current.stop();
    }
    visualizer_ref.current?.stop();
    setStatus('paused');
  };

  const handle_resume = async () => {
    const mode = capture_mode_ref.current;
    setStatus('recording');
    if (stream_ref.current && canvas_ref.current) {
      const visualizer = new WaveformVisualizer();
      visualizer_ref.current = visualizer;
      await visualizer.connect(stream_ref.current);
      visualizer.draw(canvas_ref.current);
    }
    if (mode === 'browser_stt') {
      manager_ref.current.start(
        speakingLanguage,
        {
          onResult: ({ transcript, isFinal }) => appendTranscription(transcript, isFinal),
          onError: (err) => setError(err),
          onEnd: () => {},
        },
        'web-speech',
      );
    }
  };

  const handle_stop = async () => {
    const mode = capture_mode_ref.current;
    stop_speech_and_visualizer();
    visualizer_ref.current?.stop();

    const mr = media_recorder_ref.current;
    const chunks = audio_chunks_ref.current;
    const blob = mr ? await finalize_media_recorder_blob(mr, chunks) : null;

    stop_stream_tracks();
    media_recorder_ref.current = null;
    unlockSession();

    if (blob && blob.size > 0) {
      setAudioBlob(blob);
    }

    if (mode === 'assemblyai_batch') {
      if (!blob || blob.size === 0) {
        setError('No audio captured. Try recording again.');
        setStatus('idle');
        setCaptureMode(null);
        capture_mode_ref.current = null;
        return;
      }
      const api_key = localStorage.getItem(STORAGE_KEYS.ASSEMBLYAI_API_KEY)?.trim();
      if (!api_key) {
        setError('AssemblyAI API key not set. Configure it in Settings.');
        setStatus('idle');
        setCaptureMode(null);
        capture_mode_ref.current = null;
        return;
      }
      setStatus('processing');
      try {
        assembly_service_ref.current.configure(api_key);
        const model = load_assembly_ai_model_from_storage();
        const text = await assembly_service_ref.current.transcribe(blob, speakingLanguage, model);
        setTranscription(text);
        setStatus('done');
        if (text.trim()) onTranscriptionComplete(text);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Transcription failed');
        setStatus('idle');
      } finally {
        setCaptureMode(null);
        capture_mode_ref.current = null;
      }
      return;
    }

    setStatus('done');
    setCaptureMode(null);
    capture_mode_ref.current = null;
    const final = useRecordingStore.getState().transcription;
    if (final.trim()) onTranscriptionComplete(final);
  };

  const handle_download_audio = () => {
    const blob = useRecordingStore.getState().audioBlob;
    if (!blob) return;
    const ext = blob.type.includes('webm') ? 'webm' : 'audio';
    const stamp = new Date().toISOString().replaceAll(/[:.]/g, '-').slice(0, 19);
    download_blob(blob, `recording-${stamp}.${ext}`);
  };

  const is_idle = status === 'idle';
  const is_recording = status === 'recording';
  const is_paused = status === 'paused';
  const is_done = status === 'done';
  const is_processing = status === 'processing';

  useKeyboardShortcuts({
    onSpaceToggle: useCallback(() => {
      if (is_idle) void handle_start();
      else if (is_recording || is_paused) void handle_stop();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [is_idle, is_recording, is_paused]),
  });

  if ((is_done || is_processing) && audioBlob && !audio_url_ref.current) {
    audio_url_ref.current = createAudioUrl(audioBlob);
  }

  let waveform_overlay = '';
  if (is_idle) waveform_overlay = 'Press record to start';
  else if (is_paused) waveform_overlay = 'Paused';
  else if (is_processing) waveform_overlay = 'Transcribing…';
  else if (is_done) waveform_overlay = 'Recording complete';

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          'relative h-16 w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700',
          is_recording && 'bg-indigo-50 dark:bg-indigo-900/30',
        )}
      >
        <canvas ref={canvas_ref} className="h-full w-full" />
        {!is_recording && waveform_overlay && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
            {waveform_overlay}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {is_idle && (
          <button
            onClick={() => void handle_start()}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            aria-label="Start recording"
          >
            <Mic className="h-4 w-4" />
            Record
          </button>
        )}

        {is_recording && (
          <>
            <button
              onClick={handle_pause}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
              aria-label="Pause recording"
            >
              <Pause className="h-4 w-4" />
              Pause
            </button>
            <button
              onClick={() => void handle_stop()}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              aria-label="Stop recording"
            >
              <Square className="h-4 w-4" />
              Stop
            </button>
          </>
        )}

        {is_paused && (
          <>
            <button
              onClick={() => void handle_resume()}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              aria-label="Resume recording"
            >
              <Play className="h-4 w-4" />
              Resume
            </button>
            <button
              onClick={() => void handle_stop()}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
              aria-label="Stop recording"
            >
              <Square className="h-4 w-4" />
              Stop
            </button>
          </>
        )}

        {is_done && audioBlob && (
          <button
            type="button"
            onClick={handle_download_audio}
            className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            aria-label="Download audio recording"
          >
            <Download className="h-4 w-4" />
            Download audio
          </button>
        )}

        {is_done && (
          <button
            onClick={() => {
              reset();
              unlockSession();
              draftRepository.begin_new_draft();
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            aria-label="New recording"
          >
            <MicOff className="h-4 w-4" />
            New Recording
          </button>
        )}

        {is_recording && (
          <span className="flex items-center gap-1.5 text-sm text-red-600 font-medium">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Recording · {format_elapsed(elapsed)}
          </span>
        )}

        {is_processing && (
          <span className="text-sm text-slate-600 dark:text-slate-300">Transcribing with AssemblyAI…</span>
        )}
      </div>

      {(is_done || is_processing) && audio_url_ref.current && (
        <audio
          controls
          src={audio_url_ref.current}
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
