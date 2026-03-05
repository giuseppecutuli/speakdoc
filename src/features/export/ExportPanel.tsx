import { useState } from 'react';
import { Download, Copy, CheckCheck, Mic } from 'lucide-react';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';
import { useRecordingStore } from '@/hooks/useRecordingStore';
import { copyToClipboard, downloadAsFile } from './export.service';
import { downloadAudioBlob, buildAudioFilename } from './audio-export.service';

export const ExportPanel = () => {
  const { formattedOutput, selectedFormat, isGenerating } = useDocumentationStore();
  const { audioBlob } = useRecordingStore();
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

  const handleDownloadRecording = () => {
    if (audioBlob) {
      downloadAudioBlob(audioBlob, buildAudioFilename());
    }
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
      {audioBlob && (
        <button
          onClick={handleDownloadRecording}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
          aria-label="Download recording"
          data-testid="download-recording"
        >
          <Mic className="h-3.5 w-3.5" />
          Download Recording
        </button>
      )}
    </div>
  );
};
