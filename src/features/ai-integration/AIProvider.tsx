import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { AIBackend } from '@/types/ai';
import { detectActiveBackend } from './ai-manager.service';
import { cn } from '@/utils/cn';

interface BackendConfig {
  label: string;
  icon: typeof CheckCircle;
  cls: string;
}

const BACKEND_CONFIG: Record<AIBackend, BackendConfig> = {
  'gemini-nano': {
    label: 'Gemini Nano',
    icon: CheckCircle,
    cls: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  },
  'external-api': {
    label: 'External API',
    icon: CheckCircle,
    cls: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  },
  none: {
    label: 'No AI backend',
    icon: XCircle,
    cls: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  },
};

interface AIProviderProps {
  /** Re-detect backend whenever this value changes (e.g. after saving settings). */
  refreshKey?: number;
  className?: string;
}

/**
 * Displays a badge showing the active AI backend.
 * Calls `detectActiveBackend()` on mount and whenever `refreshKey` changes.
 */
export const AIProvider = ({ refreshKey = 0, className }: AIProviderProps) => {
  const [backend, setBackend] = useState<AIBackend | null>(null);

  useEffect(() => {
    setBackend(null); // show loading while detecting
    detectActiveBackend().then(setBackend);
  }, [refreshKey]);

  if (backend === null) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700',
          className,
        )}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Detecting…
      </span>
    );
  }

  const { label, icon: Icon, cls } = BACKEND_CONFIG[backend];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        cls,
        className,
      )}
      aria-label={`Active AI backend: ${label}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
};
