import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DraftRestoreBanner } from '@/components/DraftRestoreBanner';
import type { SessionDraft } from '@/types/session';

const makeDraft = (overrides: Partial<SessionDraft> = {}): SessionDraft => ({
  id: 1,
  transcription: 'Hello world',
  generatedDoc: '# Hello\n\nWorld',
  format: 'markdown',
  speakingLanguage: 'en',
  outputLanguage: 'en',
  savedAt: new Date(),
  ...overrides,
});

describe('DraftRestoreBanner', () => {
  it('renders the banner with draft info', () => {
    render(
      <DraftRestoreBanner
        draft={makeDraft()}
        onRestore={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText(/unsaved draft/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restore/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('calls onRestore when Restore button is clicked', () => {
    const onRestore = vi.fn();
    render(
      <DraftRestoreBanner
        draft={makeDraft()}
        onRestore={onRestore}
        onDismiss={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /restore/i }));
    expect(onRestore).toHaveBeenCalledOnce();
  });

  it('calls onDismiss when dismiss (X) button is clicked', () => {
    const onDismiss = vi.fn();
    render(
      <DraftRestoreBanner
        draft={makeDraft()}
        onRestore={vi.fn()}
        onDismiss={onDismiss}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('shows "just now" for a very recent draft', () => {
    render(
      <DraftRestoreBanner
        draft={makeDraft({ savedAt: new Date() })}
        onRestore={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText(/just now/i)).toBeInTheDocument();
  });

  it('shows relative time in minutes for older draft', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    render(
      <DraftRestoreBanner
        draft={makeDraft({ savedAt: fiveMinutesAgo })}
        onRestore={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText(/5m ago/i)).toBeInTheDocument();
  });

  it('shows relative time in hours for old draft', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    render(
      <DraftRestoreBanner
        draft={makeDraft({ savedAt: twoHoursAgo })}
        onRestore={vi.fn()}
        onDismiss={vi.fn()}
      />,
    );
    expect(screen.getByText(/2h ago/i)).toBeInTheDocument();
  });
});
