import { useEffect } from 'react';

interface KeyboardShortcutsConfig {
  onSpaceToggle?: () => void;
  onSave?: () => void;
}

/** Global keyboard shortcuts that do not interfere with inputs/textareas. */
export const useKeyboardShortcuts = ({ onSpaceToggle, onSave }: KeyboardShortcutsConfig) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Space → start/stop recording (only when focus is not inside a form field)
      if (e.code === 'Space' && !isInInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onSpaceToggle?.();
      }

      // Ctrl/Cmd+S → download / save documentation
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSpaceToggle, onSave]);
};
