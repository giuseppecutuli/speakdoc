import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AssemblyAIService } from '@/features/voice-input/assemblyai.service';

const mockTranscribe = vi.fn();

vi.mock('assemblyai', () => {
  const AssemblyAI = vi.fn(function () {
    return { transcripts: { transcribe: mockTranscribe } };
  });
  return { AssemblyAI };
});

describe('AssemblyAIService', () => {
  let service: AssemblyAIService;

  beforeEach(() => {
    service = new AssemblyAIService();
    mockTranscribe.mockReset();
  });

  describe('configure()', () => {
    it('marks service as configured after valid key', () => {
      service.configure('test-api-key');
      expect(service.isConfigured()).toBe(true);
    });

    it('throws on empty string key', () => {
      expect(() => service.configure('')).toThrow('AssemblyAI API key is required');
    });

    it('throws on whitespace-only key', () => {
      expect(() => service.configure('   ')).toThrow('AssemblyAI API key is required');
    });

    it('trims whitespace from key', () => {
      service.configure('  valid-key  ');
      expect(service.isConfigured()).toBe(true);
    });
  });

  describe('isConfigured()', () => {
    it('returns false before configure()', () => {
      expect(service.isConfigured()).toBe(false);
    });

    it('returns true after configure()', () => {
      service.configure('my-key');
      expect(service.isConfigured()).toBe(true);
    });
  });

  describe('transcribe()', () => {
    beforeEach(() => {
      service.configure('test-key');
    });

    it('throws when not configured', async () => {
      const unconfigured = new AssemblyAIService();
      await expect(unconfigured.transcribe(new Blob(), 'en')).rejects.toThrow(
        'AssemblyAI service not configured',
      );
    });

    it('returns transcript text on success', async () => {
      mockTranscribe.mockResolvedValue({ status: 'completed', text: 'Hello world' });
      const result = await service.transcribe(new Blob(['audio'], { type: 'audio/webm' }), 'en');
      expect(result).toBe('Hello world');
    });

    it('returns empty string when text is null', async () => {
      mockTranscribe.mockResolvedValue({ status: 'completed', text: null });
      const result = await service.transcribe(new Blob(), 'en');
      expect(result).toBe('');
    });

    it('maps English language code correctly', async () => {
      mockTranscribe.mockResolvedValue({ status: 'completed', text: 'test' });
      await service.transcribe(new Blob(), 'en');
      expect(mockTranscribe).toHaveBeenCalledWith(
        expect.objectContaining({ language_code: 'en_us' }),
      );
    });

    it('maps Italian language code correctly', async () => {
      mockTranscribe.mockResolvedValue({ status: 'completed', text: 'prova' });
      await service.transcribe(new Blob(), 'it');
      expect(mockTranscribe).toHaveBeenCalledWith(
        expect.objectContaining({ language_code: 'it_it' }),
      );
    });

    it('uses universal-2 model by default', async () => {
      mockTranscribe.mockResolvedValue({ status: 'completed', text: 'test' });
      await service.transcribe(new Blob(), 'en');
      expect(mockTranscribe).toHaveBeenCalledWith(
        expect.objectContaining({ speech_model: 'universal-2' }),
      );
    });

    it('accepts universal-3-pro model', async () => {
      mockTranscribe.mockResolvedValue({ status: 'completed', text: 'test' });
      await service.transcribe(new Blob(), 'en', 'universal-3-pro');
      expect(mockTranscribe).toHaveBeenCalledWith(
        expect.objectContaining({ speech_model: 'universal-3-pro' }),
      );
    });

    it('disables language detection', async () => {
      mockTranscribe.mockResolvedValue({ status: 'completed', text: 'test' });
      await service.transcribe(new Blob(), 'en');
      expect(mockTranscribe).toHaveBeenCalledWith(
        expect.objectContaining({ language_detection: false }),
      );
    });

    it('throws on API error status with message', async () => {
      mockTranscribe.mockResolvedValue({ status: 'error', error: 'Audio too short' });
      await expect(service.transcribe(new Blob(), 'en')).rejects.toThrow('Audio too short');
    });

    it('throws generic message when error field is missing', async () => {
      mockTranscribe.mockResolvedValue({ status: 'error', error: null });
      await expect(service.transcribe(new Blob(), 'en')).rejects.toThrow('Transcription failed');
    });

    it('propagates network errors from client', async () => {
      mockTranscribe.mockRejectedValue(new Error('Network error'));
      await expect(service.transcribe(new Blob(), 'en')).rejects.toThrow('Network error');
    });
  });
});
