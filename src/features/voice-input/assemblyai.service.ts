import { AssemblyAI } from 'assemblyai';
import type { LanguageCode } from '@/types/language';
import { ASSEMBLYAI_LANGUAGE_MAP, type AssemblyAIModel } from '@/constants/assemblyai-config';

export class AssemblyAIService {
  private client: AssemblyAI | null = null;
  private apiKey: string | null = null;

  configure(apiKey: string): void {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('AssemblyAI API key is required');
    }
    this.apiKey = apiKey.trim();
    this.client = new AssemblyAI({ apiKey: this.apiKey });
  }

  isConfigured(): boolean {
    return this.client !== null && this.apiKey !== null;
  }

  async transcribe(
    audio: Blob,
    language: LanguageCode,
    model: AssemblyAIModel = 'universal-2',
  ): Promise<string> {
    if (!this.client) {
      throw new Error('AssemblyAI service not configured. Please set your API key in Settings.');
    }

    const languageCode = ASSEMBLYAI_LANGUAGE_MAP[language];

    const transcript = await this.client.transcripts.transcribe({
      audio,
      language_code: languageCode,
      language_detection: false,
      speech_models: [model],
    });

    if (transcript.status === 'error') {
      throw new Error(transcript.error ?? 'Transcription failed');
    }

    return transcript.text ?? '';
  }
}
