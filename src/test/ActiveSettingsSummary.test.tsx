import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/features/ai-integration/ai-manager.service', () => ({
  detectActiveBackend: vi.fn().mockResolvedValue('none'),
}));

import { ActiveSettingsSummary } from '@/components/ActiveSettingsSummary';
import { useLanguageStore } from '@/hooks/useLanguageStore';
import { useTemplateStore } from '@/hooks/useTemplateStore';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';

const onOpenSettings = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  useLanguageStore.getState().loadFromStorage();
  useLanguageStore.setState({ sessionLocked: false });
  useTemplateStore.getState().loadFromStorage();
  useDocumentationStore.getState().reset();
});

describe('ActiveSettingsSummary', () => {
  it('renders summary sections and opens settings when clicked', async () => {
    render(<ActiveSettingsSummary compact onOpenSettings={onOpenSettings} />);

    expect(screen.getByText('Active settings')).toBeInTheDocument();
    expect(screen.getByText('Languages')).toBeInTheDocument();
    expect(screen.getByText('Template')).toBeInTheDocument();
    expect(screen.getByText('Documentation format')).toBeInTheDocument();
    expect(screen.getByText('Voice capture')).toBeInTheDocument();
    expect(screen.getByText('Documentation AI')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Not configured')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('active-settings-open-settings'));
    expect(onOpenSettings).toHaveBeenCalledOnce();
  });

  it('shows language lock hint when session is locked', async () => {
    useLanguageStore.setState({ sessionLocked: true });
    render(<ActiveSettingsSummary compact onOpenSettings={onOpenSettings} />);
    expect(screen.getByText(/Locked until you change languages/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Not configured')).toBeInTheDocument();
    });
  });
});
