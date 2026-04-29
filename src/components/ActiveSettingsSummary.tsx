import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { useTemplateStore } from '@/hooks/useTemplateStore';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import { DOC_TEMPLATES } from '@/constants/doc-templates';
import type { OutputFormat } from '@/types/documentation';
import {
  loadSpeechPreference,
  resolveVoiceCaptureMode,
} from '@/features/voice-input/speech-preference';
import { loadAssemblyAiModelFromStorage } from '@/constants/assemblyai-config';
import { detectActiveBackend } from '@/features/ai-integration/ai-manager.service';
import type { AIBackend } from '@/types/ai';
import { cn } from '@/utils/cn';

const OUTPUT_FORMAT_LABELS: Record<OutputFormat, string> = {
  markdown: 'Markdown',
  wiki: 'Confluence Wiki',
  html: 'HTML Preview',
};

const SPEECH_PREF_LABEL: Record<string, string> = {
  auto: 'Auto',
  'web-speech': 'Web Speech API',
  'assemblyai-batch': 'AssemblyAI (after stop)',
};

const DOC_AI_LABELS: Record<AIBackend, string> = {
  'gemini-nano': 'Gemini Nano (browser)',
  'external-api': 'External API',
  none: 'Not configured',
};

function describeMicCapture(): { preference: string; effective: string; assembly_model?: string } {
  const pref = loadSpeechPreference();
  const mode = resolveVoiceCaptureMode();
  const preference = SPEECH_PREF_LABEL[pref] ?? pref;
  let effective: string;
  if (mode === 'browser_stt') {
    effective = 'Next mic take: live browser speech-to-text';
  } else if (mode === 'assemblyai_batch') {
    effective = 'Next mic take: record audio, then AssemblyAI after Stop';
  } else {
    effective = 'Microphone path unavailable — open Settings to fix Speech & keys';
  }
  const assembly_model =
    pref === 'assemblyai-batch' || mode === 'assemblyai_batch'
      ? loadAssemblyAiModelFromStorage()
      : undefined;
  return { preference, effective, assembly_model };
}

interface ActiveSettingsSummaryProps {
  /** Match sidebar panels (In progress, History, Help). */
  compact?: boolean;
  onOpenSettings: () => void;
}

export const ActiveSettingsSummary = ({ compact = false, onOpenSettings }: ActiveSettingsSummaryProps) => {
  const speakingLanguage = useLanguageStore((s) => s.speakingLanguage);
  const outputLanguage = useLanguageStore((s) => s.outputLanguage);
  const sessionLocked = useLanguageStore((s) => s.sessionLocked);
  const selectedTemplateId = useTemplateStore((s) => s.selectedTemplateId);
  const selectedFormat = useDocumentationStore((s) => s.selectedFormat);

  const [docAiBackend, setDocAiBackend] = useState<AIBackend>('none');
  const [settingsEchoTick, setSettingsEchoTick] = useState(0);

  const mic = useMemo(() => describeMicCapture(), [settingsEchoTick]);

  useEffect(() => {
    let cancelled = false;
    const refresh_from_storage = () => {
      detectActiveBackend().then((b) => {
        if (!cancelled) setDocAiBackend(b);
      });
      setSettingsEchoTick((t) => t + 1);
    };
    refresh_from_storage();
    globalThis.addEventListener('focus', refresh_from_storage);
    return () => {
      cancelled = true;
      globalThis.removeEventListener('focus', refresh_from_storage);
    };
  }, []);

  const speaking_label = SUPPORTED_LANGUAGES[speakingLanguage]?.label ?? speakingLanguage;
  const output_label = SUPPORTED_LANGUAGES[outputLanguage]?.label ?? outputLanguage;
  const template_label = DOC_TEMPLATES[selectedTemplateId]?.label ?? selectedTemplateId;
  const format_label = OUTPUT_FORMAT_LABELS[selectedFormat] ?? selectedFormat;

  return (
    <div
      data-active-settings-summary
      className={cn(
        'rounded-xl border bg-white dark:bg-slate-800 shadow-sm',
        {
          'border-slate-200/70 dark:border-slate-700/80 p-4 shadow-none dark:bg-slate-800/90': compact,
          'border-slate-200 dark:border-slate-700 p-6': !compact,
        },
      )}
    >
      <div className={cn('flex items-center gap-2', { 'mb-3': compact, 'mb-4': !compact })}>
        <SlidersHorizontal
          className={cn('shrink-0 text-slate-500 dark:text-slate-400', {
            'h-3.5 w-3.5': compact,
            'h-4 w-4': !compact,
          })}
          aria-hidden
        />
        <h2
          className={cn({
            'text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400': compact,
            'text-base font-semibold text-slate-900 dark:text-slate-100': !compact,
          })}
        >
          Active settings
        </h2>
      </div>

      <dl
        className={cn('space-y-2.5 text-slate-700 dark:text-slate-200', {
          'text-[11px] leading-snug': compact,
          'text-sm': !compact,
        })}
      >
        <div>
          <dt className="font-medium text-slate-500 dark:text-slate-400">Languages</dt>
          <dd>
            {speaking_label} → {output_label}
            {sessionLocked && (
              <span className="mt-1 block text-slate-500 dark:text-slate-400">
                Locked until you change languages or regenerate
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500 dark:text-slate-400">Template</dt>
          <dd>{template_label}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500 dark:text-slate-400">Documentation format</dt>
          <dd>{format_label}</dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500 dark:text-slate-400">Voice capture</dt>
          <dd>
            <span className="block">{mic.preference}</span>
            <span className="mt-0.5 block text-slate-600 dark:text-slate-300">{mic.effective}</span>
            {mic.assembly_model != null && (
              <span className="mt-0.5 block text-slate-500 dark:text-slate-400">
                AssemblyAI model: {mic.assembly_model}
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-slate-500 dark:text-slate-400">Documentation AI</dt>
          <dd>{DOC_AI_LABELS[docAiBackend]}</dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={onOpenSettings}
        className={cn(
          'mt-3 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 px-3 py-2 text-left text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
          { 'py-1.5': compact },
        )}
        data-testid="active-settings-open-settings"
      >
        Open full settings
      </button>
    </div>
  );
};
