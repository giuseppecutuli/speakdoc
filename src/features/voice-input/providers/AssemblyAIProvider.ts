import { AssemblyAI } from 'assemblyai';
import type { TurnEvent } from 'assemblyai';
import type { LanguageCode } from '@/types/language';
import type { TranscriptionResult } from '@/types/voice';
import type { ISpeechProvider, SpeechProviderName } from '../types/speech-provider';
import { STORAGE_KEYS } from '@/constants/config';
import { ASSEMBLYAI_STREAMING_MODEL_MAP } from '@/constants/assemblyai-config';

const SAMPLE_RATE = 16_000;

/**
 * AssemblyAI real-time speech provider.
 * Streams PCM audio via AudioContext → AudioWorklet → AssemblyAI StreamingTranscriber.
 * The user's own API key (stored in localStorage) is used directly.
 */
export class AssemblyAIProvider implements ISpeechProvider {
  readonly name: SpeechProviderName = 'assemblyai';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private transcriber: any = null;
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private stream: MediaStream | null = null;
  private aborted = false;

  private resultCallback: ((result: TranscriptionResult) => void) | null = null;
  private errorCallback: ((error: string) => void) | null = null;
  private endCallback: (() => void) | null = null;

  isAvailable(): boolean {
    return typeof AudioContext !== 'undefined' && typeof navigator?.mediaDevices !== 'undefined';
  }

  isConfigured(): boolean {
    const key = localStorage.getItem(STORAGE_KEYS.ASSEMBLYAI_API_KEY);
    return typeof key === 'string' && key.trim().length > 0;
  }

  onResult(callback: (result: TranscriptionResult) => void): void {
    this.resultCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    this.errorCallback = callback;
  }

  onEnd(callback: () => void): void {
    this.endCallback = callback;
  }

  start(language: LanguageCode): void {
    this.aborted = false;
    this.startAsync(language).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to start transcription';
      this.errorCallback?.(message);
      this.endCallback?.();
    });
  }

  private async startAsync(language: LanguageCode): Promise<void> {
    const apiKey = localStorage.getItem(STORAGE_KEYS.ASSEMBLYAI_API_KEY)?.trim();
    if (!apiKey) {
      throw new Error('AssemblyAI API key not set. Please configure it in Settings.');
    }

    const speechModel = ASSEMBLYAI_STREAMING_MODEL_MAP[language];
    const client = new AssemblyAI({ apiKey });
    const transcriber = client.streaming.transcriber({
      sampleRate: SAMPLE_RATE,
      speechModel,
    });
    this.transcriber = transcriber;

    transcriber.on('turn', (event: TurnEvent) => {
      if (!this.aborted && event.transcript) {
        this.resultCallback?.({ transcript: event.transcript, isFinal: event.end_of_turn });
      }
    });

    transcriber.on('error', (error: Error) => {
      if (!this.aborted) {
        this.errorCallback?.(error.message ?? 'Streaming error');
      }
    });

    transcriber.on('close', () => {
      this.cleanup();
      if (!this.aborted) {
        this.endCallback?.();
      }
    });

    await transcriber.connect();

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.stream = stream;

    const audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
    this.audioContext = audioContext;

    await audioContext.audioWorklet.addModule('/pcm-processor.worklet.js');

    const workletNode = new AudioWorkletNode(audioContext, 'pcm-processor');
    this.workletNode = workletNode;

    workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      if (this.aborted) return;
      transcriber.sendAudio(event.data);
    };

    const source = audioContext.createMediaStreamSource(stream);
    source.connect(workletNode);
    workletNode.connect(audioContext.destination);
  }

  stop(): void {
    // Closing the transcriber triggers the 'close' event → cleanup + endCallback
    if (this.transcriber) {
      this.transcriber.close().catch(() => {
        this.cleanup();
        this.endCallback?.();
      });
    }
  }

  abort(): void {
    this.aborted = true;
    this.cleanup();
    // Do not call endCallback — aborted sessions are silently discarded
  }

  private cleanup(): void {
    this.workletNode?.disconnect();
    this.workletNode = null;

    this.audioContext?.close().catch(() => undefined);
    this.audioContext = null;

    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;

    this.transcriber = null;
  }
}
