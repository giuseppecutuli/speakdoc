import { FileText, Settings2, Moon, Sun } from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';

interface LayoutProps {
  children: React.ReactNode;
  onSettingsClick: () => void;
}

export const Layout = ({ children, onSettingsClick }: LayoutProps) => {
  const { dark, toggle } = useDarkMode();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3 md:max-w-[88rem] md:px-6 xl:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <FileText className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-base font-semibold text-slate-900 dark:text-slate-100">Speak Doc</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggle}
              className="rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={dark ? 'Light mode' : 'Dark mode'}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={onSettingsClick}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Open settings"
            >
              <Settings2 className="h-4 w-4" aria-hidden="true" />
              Settings
            </button>
          </div>
        </div>
      </header>

      <main
        className="mx-auto w-full max-w-3xl px-4 py-8 md:max-w-[88rem] md:px-6 xl:px-8"
        id="main-content"
      >
        {children}
      </main>
    </div>
  );
};
