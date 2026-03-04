import { FileText } from 'lucide-react';
import { SettingsPanel } from './Settings';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => (
  <div className="min-h-screen bg-slate-50">
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-semibold text-slate-900">Doc Assistant</span>
        </div>
        <SettingsPanel />
      </div>
    </header>

    <main className="mx-auto max-w-3xl px-4 py-8">
      {children}
    </main>
  </div>
);
