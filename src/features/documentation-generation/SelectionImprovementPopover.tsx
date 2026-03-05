import { useState, useRef, useEffect, useCallback } from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';
import { improveSelection } from './inline-improvement.service';

interface Props {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  content: string;
  onContentChange: (newContent: string) => void;
}

interface SelectionAnchor {
  start: number;
  end: number;
  top: number;
  left: number;
}

const MIN_SELECTION_LENGTH = 3;
const MAX_INSTRUCTION_LENGTH = 500;

export const SelectionImprovementPopover = ({ textareaRef, content, onContentChange }: Props) => {
  const { pushHistory, setFormattedOutput, isGenerating } = useDocumentationStore();

  const [anchor, setAnchor] = useState<SelectionAnchor | null>(null);
  const [instruction, setInstruction] = useState('');
  const [isImproving, setIsImproving] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => {
    setAnchor(null);
    setInstruction('');
  }, []);

  // Detect selection changes on the textarea
  const handleSelect = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;

    if (end - start < MIN_SELECTION_LENGTH) {
      setAnchor(null);
      return;
    }

    const rect = el.getBoundingClientRect();
    setAnchor({ start, end, top: rect.top + window.scrollY - 48, left: rect.left + window.scrollX });
  }, [textareaRef]);

  // Dismiss on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dismiss]);

  // Dismiss on click-outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        anchor &&
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        dismiss();
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [anchor, dismiss, textareaRef]);

  // Dismiss on scroll
  useEffect(() => {
    const onScroll = () => dismiss();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [dismiss]);

  // Register onSelect handler on the textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.addEventListener('select', handleSelect);
    return () => el.removeEventListener('select', handleSelect);
  }, [textareaRef, handleSelect]);

  const handleImprove = async () => {
    if (!anchor || !instruction.trim() || isImproving || isGenerating) return;

    const selectedText = content.slice(anchor.start, anchor.end);
    const storeState = useDocumentationStore.getState();
    const lang = (storeState as { outputLanguage?: string }).outputLanguage ?? 'en';

    pushHistory(content);

    setIsImproving(true);
    try {
      let improved = '';
      for await (const chunk of improveSelection(selectedText, instruction.trim(), lang as 'en' | 'it')) {
        improved += chunk;
      }
      const newContent = content.slice(0, anchor.start) + improved + content.slice(anchor.end);
      onContentChange(newContent);
      setFormattedOutput(newContent);
    } catch {
      // silently revert — history already captures previous state
    } finally {
      setIsImproving(false);
      dismiss();
    }
  };

  if (!anchor) return null;

  const popoverStyle: React.CSSProperties = {
    position: 'fixed',
    top: anchor.top,
    left: anchor.left,
    zIndex: 50,
  };

  return (
    <div
      ref={popoverRef}
      style={popoverStyle}
      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg"
      role="dialog"
      aria-label="Improve selection"
    >
      <Wand2 className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
      <input
        type="text"
        value={instruction}
        onChange={(e) => setInstruction(e.target.value.slice(0, MAX_INSTRUCTION_LENGTH))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleImprove();
          if (e.key === 'Escape') dismiss();
        }}
        placeholder="Instruction (e.g. make formal)"
        className="w-52 border-none bg-transparent text-xs text-slate-800 outline-none placeholder:text-slate-400"
        autoFocus
        disabled={isImproving}
        aria-label="Improvement instruction"
      />
      <button
        onClick={handleImprove}
        disabled={!instruction.trim() || isImproving || isGenerating}
        className="flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        aria-label="Apply improvement"
      >
        {isImproving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Improve'}
      </button>
    </div>
  );
};
