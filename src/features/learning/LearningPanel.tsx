import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Lightbulb } from 'lucide-react';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { sessionRepository, feedbackRepository } from '@/utils/repositories';
import { analyzePatterns, generateSuggestions } from './learning-engine.service';

interface SuggestionItem {
  text: string;
  feedback: 'helpful' | 'not-helpful' | null;
}

export const LearningPanel = () => {
  const { outputLanguage } = useLanguageStore();
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const sessions = await sessionRepository.getAll();
      const pattern = analyzePatterns(sessions);
      if (cancelled) return;
      if (!pattern) {
        setLoaded(true);
        return;
      }
      const texts = generateSuggestions(pattern, outputLanguage);
      setSuggestions(texts.map((text) => ({ text, feedback: null })));
      setLoaded(true);
    };

    load();
    return () => { cancelled = true; };
  }, [outputLanguage]);

  const handleFeedback = async (index: number, rating: 'helpful' | 'not-helpful') => {
    setSuggestions((prev) =>
      prev.map((s, i) => (i === index ? { ...s, feedback: rating } : s)),
    );

    try {
      // Save feedback linked to the most recent session (if any)
      const recent = await sessionRepository.getRecent(1);
      if (recent[0]?.id !== undefined) {
        await feedbackRepository.save({
          sessionId: recent[0].id as number,
          rating,
          createdAt: new Date(),
        });
      }
    } catch {
      // feedback save failure is non-critical
    }
  };

  if (!loaded || suggestions.length === 0) return null;

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-indigo-900">Suggestions</h3>
      </div>
      <ul className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <li
            key={index}
            className="flex items-start justify-between gap-3 rounded-lg bg-white p-3 shadow-sm"
            data-testid="suggestion-item"
          >
            <p className="text-sm text-slate-700">{suggestion.text}</p>
            <div className="flex shrink-0 items-center gap-1">
              {suggestion.feedback === null ? (
                <>
                  <button
                    onClick={() => handleFeedback(index, 'helpful')}
                    className="rounded p-1 text-slate-400 hover:bg-green-50 hover:text-green-600 transition-colors"
                    aria-label="Mark as helpful"
                    data-testid="feedback-helpful"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleFeedback(index, 'not-helpful')}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    aria-label="Mark as not helpful"
                    data-testid="feedback-not-helpful"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <span className="text-xs text-slate-400">
                  {suggestion.feedback === 'helpful' ? 'Thanks!' : 'Got it'}
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
