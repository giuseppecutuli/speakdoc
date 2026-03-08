import * as Tabs from '@radix-ui/react-tabs';
import { Copy, RefreshCw, CheckCheck, Undo2, Redo2, Wand2, BookmarkCheck, Pencil, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { sessionRepository } from '@/utils/repositories';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';
import { applyFormat } from './doc-generator.service';
import { cn } from '@/utils/cn';
import type { OutputFormat } from '@/types/documentation';
import { SelectionImprovementPopover } from './SelectionImprovementPopover';
import { DocumentImprovementModal } from './DocumentImprovementModal';

const FORMATS: { value: OutputFormat; label: string }[] = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'wiki', label: 'Confluence Wiki' },
  { value: 'html', label: 'HTML Preview' },
];

interface DocumentationEditorProps {
  onRegenerate?: () => void;
  outputLanguage?: 'en' | 'it';
}

export const DocumentationEditor = ({ onRegenerate, outputLanguage = 'en' }: DocumentationEditorProps) => {
  const {
    rawAIResponse,
    selectedFormat,
    isGenerating,
    savedToHistory,
    lastSavedSessionId,
    setFormat,
    setFormattedOutput,
    canUndo,
    canRedo,
    pendingRestore,
    undo,
    redo,
    clearPendingRestore,
  } = useDocumentationStore();

  const [editedContent, setEditedContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [improveModalOpen, setImproveModalOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [savedName, setSavedName] = useState('');
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (rawAIResponse) {
      const formatted = applyFormat(rawAIResponse, selectedFormat);
      setEditedContent(formatted);
      setFormattedOutput(formatted);
    }
  }, [rawAIResponse, selectedFormat, setFormattedOutput]);

  // Apply undo/redo restore
  useEffect(() => {
    if (pendingRestore !== null) {
      setEditedContent(pendingRestore);
      setFormattedOutput(pendingRestore);
      clearPendingRestore();
    }
  }, [pendingRestore, setFormattedOutput, clearPendingRestore]);

  useEffect(() => {
    if (isEditingName) nameInputRef.current?.focus();
  }, [isEditingName]);

  const handleSaveName = async () => {
    if (!lastSavedSessionId) return;
    const trimmed = sessionName.trim();
    await sessionRepository.update(lastSavedSessionId, { name: trimmed || undefined });
    setSavedName(trimmed);
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') { setSessionName(savedName); setIsEditingName(false); }
  };

  const handleFormatChange = (format: string) => {
    const f = format as OutputFormat;
    setFormat(f);
    const formatted = applyFormat(rawAIResponse, f);
    setEditedContent(formatted);
    setFormattedOutput(formatted);
  };

  const handleEdit = (value: string) => {
    setEditedContent(value);
    setFormattedOutput(value);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = editedContent;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isHtmlTab = selectedFormat === 'html';

  if (!rawAIResponse && !isGenerating) return null;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Generated Documentation</h3>
          {savedToHistory && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <BookmarkCheck className="h-3 w-3" />
              Saved to history
            </span>
          )}
          {savedToHistory && lastSavedSessionId && (
            <div className="flex items-center gap-1">
              {isEditingName ? (
                <>
                  <input
                    ref={nameInputRef}
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    placeholder="Session name…"
                    className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-40"
                  />
                  <button
                    onClick={handleSaveName}
                    className="rounded p-0.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                    aria-label="Save session name"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => { setSessionName(savedName); setIsEditingName(true); }}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Name this session"
                >
                  <Pencil className="h-3 w-3" />
                  {savedName || 'Name session'}
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Undo / Redo */}
          <button
            onClick={undo}
            disabled={!canUndo}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
            aria-label="Undo"
            title="Undo"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
            aria-label="Redo"
            title="Redo"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </button>

          {/* Improve Doc button — disabled on HTML tab */}
          {!isHtmlTab && (
            <button
              onClick={() => setImproveModalOpen(true)}
              disabled={isGenerating || !editedContent}
              className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
              aria-label="Improve document with AI"
              title={isHtmlTab ? 'Not available in HTML preview' : 'Improve document with AI'}
            >
              <Wand2 className="h-3.5 w-3.5 text-indigo-500" />
              Improve
            </button>
          )}

          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
              aria-label="Regenerate documentation"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isGenerating && 'animate-spin')} />
              Regenerate
            </button>
          )}
          <button
            onClick={handleCopy}
            disabled={!editedContent}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            aria-label="Copy to clipboard"
          >
            {copied ? (
              <><CheckCheck className="h-3.5 w-3.5" /> Copied!</>
            ) : (
              <><Copy className="h-3.5 w-3.5" /> Copy</>
            )}
          </button>
        </div>
      </div>

      <Tabs.Root value={selectedFormat} onValueChange={handleFormatChange}>
        <Tabs.List className="flex border-b border-slate-200 dark:border-slate-700 px-4">
          {FORMATS.map((f) => (
            <Tabs.Trigger
              key={f.value}
              value={f.value}
              className={cn(
                'border-b-2 border-transparent px-3 py-2 text-sm font-medium text-slate-500 dark:text-slate-400',
                'hover:text-slate-700 dark:hover:text-slate-200 transition-colors',
                'data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400',
              )}
            >
              {f.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {FORMATS.map((f) => (
          <Tabs.Content key={f.value} value={f.value} className="p-4">
            {isGenerating && !rawAIResponse ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating documentation…
              </div>
            ) : f.value === 'html' ? (
              <div
                className="prose prose-sm max-w-none text-slate-800 dark:text-slate-200"
                dangerouslySetInnerHTML={{ __html: editedContent }}
              />
            ) : (
              <textarea
                ref={textareaRef}
                value={editedContent}
                onChange={(e) => handleEdit(e.target.value)}
                className="w-full resize-none rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-3 font-mono text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-64"
                aria-label={`${f.label} output`}
                spellCheck={false}
              />
            )}
          </Tabs.Content>
        ))}
      </Tabs.Root>

      {/* Selection improvement popover — only for non-HTML tabs */}
      {!isHtmlTab && (
        <SelectionImprovementPopover
          textareaRef={textareaRef}
          content={editedContent}
          onContentChange={handleEdit}
        />
      )}

      {/* Document improvement modal */}
      <DocumentImprovementModal
        open={improveModalOpen}
        onOpenChange={setImproveModalOpen}
        content={editedContent}
        onContentChange={handleEdit}
        outputLanguage={outputLanguage}
      />
    </div>
  );
};
