import { useState } from 'react';
import { Download, Copy, CheckCheck } from 'lucide-react';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';
import { copyToClipboard, downloadAsFile } from './export.service';

export const ExportPanel = () => {
  const { formattedOutput, selectedFormat, isGenerating } = useDocumentationStore();
  const [copied, setCopied] = useState(false);

  const disabled = !formattedOutput || isGenerating;

  const handleCopy = async () => {
    try {
      await copyToClipboard(formattedOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available — silent fail
    }
  };

  const handleDownload = () => {
    downloadAsFile(formattedOutput, selectedFormat);
  };

  if (disabled) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
        aria-label="Copy to clipboard"
      >
        {copied ? (
          <>
            <CheckCheck className="h-3.5 w-3.5 text-green-600" />
            Copied!
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy
          </>
        )}
      </button>
      <button
        onClick={handleDownload}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
        aria-label="Download as file"
      >
        <Download className="h-3.5 w-3.5" />
        Download
      </button>
    </div>
  );
};
