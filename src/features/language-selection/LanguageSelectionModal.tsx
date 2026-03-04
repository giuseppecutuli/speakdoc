import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check, Languages } from 'lucide-react';
import { useState } from 'react';
import type { LanguageCode } from '@/types/language';
import { LANGUAGE_OPTIONS } from '@/constants/languages';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { cn } from '@/utils/cn';

interface LanguageSelectionModalProps {
  open: boolean;
  onConfirm: () => void;
}

const LanguageSelect = ({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: LanguageCode;
  onChange: (v: LanguageCode) => void;
  disabled?: boolean;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-slate-700">{label}</label>
    <Select.Root value={value} onValueChange={(v) => onChange(v as LanguageCode)} disabled={disabled}>
      <Select.Trigger
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
        aria-label={label}
      >
        <Select.Value />
        <Select.Icon>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content className="z-50 overflow-hidden rounded-md border border-slate-200 bg-white shadow-md">
          <Select.Viewport className="p-1">
            {LANGUAGE_OPTIONS.map((lang) => (
              <Select.Item
                key={lang.code}
                value={lang.code}
                className={cn(
                  'relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
                  'focus:bg-indigo-50 focus:text-indigo-900',
                  'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                )}
              >
                <Select.ItemIndicator className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  <Check className="h-4 w-4" />
                </Select.ItemIndicator>
                <Select.ItemText>
                  {lang.label} <span className="text-slate-400">({lang.nativeLabel})</span>
                </Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  </div>
);

export const LanguageSelectionModal = ({ open, onConfirm }: LanguageSelectionModalProps) => {
  const { speakingLanguage, outputLanguage, setLanguages } = useLanguageStore();
  const [speaking, setSpeaking] = useState<LanguageCode>(speakingLanguage);
  const [output, setOutput] = useState<LanguageCode>(outputLanguage);

  const handleConfirm = () => {
    setLanguages(speaking, output);
    onConfirm();
  };

  return (
    <Dialog.Root open={open}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2',
            'rounded-xl bg-white p-6 shadow-xl focus:outline-none',
          )}
          aria-describedby="language-modal-desc"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
              <Languages className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <Dialog.Title className="text-lg font-semibold text-slate-900">
                Select Languages
              </Dialog.Title>
              <p id="language-modal-desc" className="text-sm text-slate-500">
                Choose how you'll speak and what language to generate docs in.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <LanguageSelect
              label="Speaking language (your voice)"
              value={speaking}
              onChange={setSpeaking}
            />
            <LanguageSelect
              label="Output language (documentation)"
              value={output}
              onChange={setOutput}
            />
          </div>

          <div className="mt-6">
            <button
              onClick={handleConfirm}
              className={cn(
                'w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white',
                'hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
                'transition-colors',
              )}
            >
              Start Session
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
