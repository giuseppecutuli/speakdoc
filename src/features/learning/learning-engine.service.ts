import type { DocumentationSession } from '@/types/session';
import type { LanguagePair } from '@/types/language';
import type { OutputFormat } from '@/types/documentation';
import { MIN_SESSIONS_FOR_SUGGESTIONS } from '@/constants/config';

export interface UsagePattern {
  mostUsedFormat: OutputFormat;
  mostUsedLanguagePair: LanguagePair;
  totalSessions: number;
}

const mostFrequent = <T>(items: T[]): T => {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = String(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let best = items[0];
  let bestCount = 0;
  for (const item of items) {
    const count = counts.get(String(item)) ?? 0;
    if (count > bestCount) {
      bestCount = count;
      best = item;
    }
  }
  return best;
};

export const analyzePatterns = (sessions: DocumentationSession[]): UsagePattern | null => {
  if (sessions.length < MIN_SESSIONS_FOR_SUGGESTIONS) return null;

  return {
    mostUsedFormat: mostFrequent(sessions.map((s) => s.format)),
    mostUsedLanguagePair: mostFrequent(
      sessions.map((s) => `${s.speakingLanguage}→${s.outputLanguage}` as LanguagePair),
    ),
    totalSessions: sessions.length,
  };
};

export const generateSuggestions = (
  pattern: UsagePattern,
  outputLanguage: 'en' | 'it',
): string[] => {
  const suggestions: string[] = [];

  if (outputLanguage === 'it') {
    suggestions.push(
      `Stai usando principalmente il formato ${pattern.mostUsedFormat.toUpperCase()}. Considera di esplorare altri formati.`,
      `Hai completato ${pattern.totalSessions} sessioni. Il tuo flusso di lavoro sta migliorando!`,
      `Coppia linguistica più usata: ${pattern.mostUsedLanguagePair}. Ottimo per la documentazione multilingue.`,
    );
  } else {
    suggestions.push(
      `You primarily use ${pattern.mostUsedFormat.toUpperCase()} format. Consider exploring other formats.`,
      `You've completed ${pattern.totalSessions} sessions. Your documentation workflow is improving!`,
      `Most used language pair: ${pattern.mostUsedLanguagePair}. Great for multilingual documentation.`,
    );
  }

  return suggestions;
};
