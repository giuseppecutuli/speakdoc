import { CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { AIBackend } from '@/types/ai';

const BADGE_MAP: Record<AIBackend, { label: string; icon: typeof CheckCircle; cls: string }> = {
  'gemini-nano': { label: 'Gemini Nano', icon: CheckCircle, cls: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' },
  'external-api': { label: 'External API', icon: CheckCircle, cls: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' },
  none: { label: 'No AI backend', icon: XCircle, cls: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' },
};

interface Props {
  backend: AIBackend;
}

export const BackendBadge = ({ backend }: Props) => {
  const { label, icon: Icon, cls } = BADGE_MAP[backend];
  return (
    <span className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', cls)}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
};
