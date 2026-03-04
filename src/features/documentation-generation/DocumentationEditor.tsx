import * as Tabs from '@radix-ui/react-tabs';
import { Copy, RefreshCw, CheckCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';
import { applyFormat } from './doc-generator.service';
import { cn } from '@/utils/cn';
import type { OutputFormat } from '@/types/documentation';

const FORMATS: { value: OutputFormat; label: string }[] = [
  { value: 'markdown', label: 'Markdown' },
  { value: 'wiki', label: 'Confluence Wiki' },
  { value: 'html', label: 'HTML Preview' },
];

interface DocumentationEditorProps {
  onRegenerate?: () => void;
}

export const DocumentationEditor = ({ onRegenerate }: DocumentationEditorProps) => {
  const { rawAIResponse, selectedFormat, isGenerating, setFormat, setFormattedOutput } =
    useDocumentationStore();

  const [editedContent, setEditedContent] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (rawAIResponse) {
      const formatted = applyFormat(rawAIResponse, selectedFormat);
      setEditedContent(formatted);
      setFormattedOutput(formatted);
    }
  }, [rawAIResponse, selectedFormat, setFormattedOutput]);

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

  if (!rawAIResponse && !isGenerating) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">Generated Documentation</h3>
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 transition-colors"
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
        <Tabs.List className="flex border-b border-slate-200 px-4">
          {FORMATS.map((f) => (
            <Tabs.Trigger
              key={f.value}
              value={f.value}
              className={cn(
                'border-b-2 border-transparent px-3 py-2 text-sm font-medium text-slate-500',
                'hover:text-slate-700 transition-colors',
                'data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600',
              )}
            >
              {f.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {FORMATS.map((f) => (
          <Tabs.Content key={f.value} value={f.value} className="p-4">
            {isGenerating && !rawAIResponse ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating documentation…
              </div>
            ) : f.value === 'html' ? (
              <div
                className="prose prose-sm max-w-none text-slate-800"
                dangerouslySetInnerHTML={{ __html: editedContent }}
              />
            ) : (
              <textarea
                value={editedContent}
                onChange={(e) => handleEdit(e.target.value)}
                className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-64"
                aria-label={`${f.label} output`}
                spellCheck={false}
              />
            )}
          </Tabs.Content>
        ))}
      </Tabs.Root>
    </div>
  );
};
