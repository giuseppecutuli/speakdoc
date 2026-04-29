import * as Dialog from '@radix-ui/react-dialog';
import { Tag, X } from 'lucide-react';

export type DraftTitleDialogVariant = 'save' | 'rename';

interface DraftTitleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: DraftTitleDialogVariant;
  titleValue: string;
  onTitleChange: (value: string) => void;
  onConfirm: () => void | Promise<void>;
  isBusy: boolean;
}

const COPY: Record<
  DraftTitleDialogVariant,
  { heading: string; body: string; confirm: string; placeholder: string }
> = {
  save: {
    heading: 'Save draft',
    body: 'Optional: give this draft a name. Leave blank to use an automatic date-based title.',
    confirm: 'Save',
    placeholder: 'e.g. Q1 planning notes',
  },
  rename: {
    heading: 'Edit draft name',
    body: 'Change how this draft appears in the In progress list. Leave blank for the default title.',
    confirm: 'Save name',
    placeholder: 'Draft title…',
  },
};

export const DraftTitleDialog = ({
  open,
  onOpenChange,
  variant,
  titleValue,
  onTitleChange,
  onConfirm,
  isBusy,
}: DraftTitleDialogProps) => {
  const copy = COPY[variant];

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next_open) => {
        if (!next_open && !isBusy) onOpenChange(false);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[70] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-xl focus:outline-none"
          aria-describedby={undefined}
        >
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <Tag className="h-4 w-4 text-indigo-500" aria-hidden />
              {copy.heading}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                onClick={() => !isBusy && onOpenChange(false)}
                disabled={isBusy}
                className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">{copy.body}</p>

          <label htmlFor="draft-title-input" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Name
          </label>
          <input
            id="draft-title-input"
            type="text"
            value={titleValue}
            onChange={(e) => onTitleChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isBusy) void onConfirm();
            }}
            disabled={isBusy}
            placeholder={copy.placeholder}
            maxLength={120}
            className="mb-4 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            autoComplete="off"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => !isBusy && onOpenChange(false)}
              disabled={isBusy}
              className="rounded-lg border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void onConfirm()}
              disabled={isBusy}
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isBusy ? 'Saving…' : copy.confirm}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
