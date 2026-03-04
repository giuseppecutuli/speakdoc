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
    cls: 'text-green-700 bg-green-50 border-green-200',
  },
  'external-api': {
    label: 'External API',
    icon: CheckCircle,
    cls: 'text-blue-700 bg-blue-50 border-blue-200',
  },
  none: {
    label: 'No AI backend',
    icon: XCircle,
    cls: 'text-red-700 bg-red-50 border-red-200',
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
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-slate-500 bg-slate-50 border-slate-200',
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
