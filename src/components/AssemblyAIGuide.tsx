import { ExternalLink, Key, Mic, Zap } from 'lucide-react';

export const AssemblyAIGuide = () => (
  <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-4 space-y-3 text-sm">
    <div className="flex items-center gap-2 font-semibold text-blue-800 dark:text-blue-300">
      <Zap className="h-4 w-4 shrink-0" />
      How to get your AssemblyAI API key
    </div>

    <ol className="space-y-2 text-blue-700 dark:text-blue-400 list-none">
      <li className="flex gap-2">
        <span className="shrink-0 font-bold">1.</span>
        <span>
          Create a free account at{' '}
          <a
            href="https://www.assemblyai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline hover:text-blue-900 dark:hover:text-blue-200"
          >
            assemblyai.com
            <ExternalLink className="h-3 w-3" />
          </a>
        </span>
      </li>
      <li className="flex gap-2">
        <span className="shrink-0 font-bold">2.</span>
        <span>
          Go to your{' '}
          <a
            href="https://www.assemblyai.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 underline hover:text-blue-900 dark:hover:text-blue-200"
          >
            Dashboard
            <ExternalLink className="h-3 w-3" />
          </a>{' '}
          and copy your API key.
        </span>
      </li>
      <li className="flex gap-2">
        <span className="shrink-0 font-bold">3.</span>
        <span>Paste it in the field above and save.</span>
      </li>
    </ol>

    <div className="flex flex-col gap-1.5 pt-1 border-t border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400">
        <Key className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>Your API key is stored locally in your browser and never sent to our servers.</span>
      </div>
      <div className="flex items-start gap-2 text-blue-600 dark:text-blue-400">
        <Mic className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>
          AssemblyAI offers high-accuracy transcription (~97%) for English and Italian. The free
          tier includes 100 hours/month.
        </span>
      </div>
    </div>
  </div>
);
