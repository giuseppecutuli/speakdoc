import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockSessionRepo = vi.hoisted(() => ({
  getRecent: vi.fn(),
  getById: vi.fn().mockResolvedValue(undefined),
  update: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn(),
}));

vi.mock('@/utils/repositories', () => ({
  sessionRepository: mockSessionRepo,
  feedbackRepository: {},
  draftRepository: {},
}));

vi.mock('@/features/export/export.service', () => ({
  copyToClipboard: vi.fn().mockResolvedValue(undefined),
  downloadAsFile: vi.fn(),
}));

import { SessionHistory } from '@/features/learning/SessionHistory';
import type { DocumentationSession } from '@/types/session';

const makeSession = (overrides: Partial<DocumentationSession> = {}): DocumentationSession => ({
  id: 1,
  speakingLanguage: 'en',
  outputLanguage: 'en',
  transcription: 'This is a test transcription of sufficient length to show in the history list.',
  generatedDoc: '# Test Doc\n\nContent here',
  format: 'markdown',
  aiBackend: 'external-api',
  createdAt: new Date('2024-01-15T10:30:00'),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockSessionRepo.delete.mockResolvedValue(undefined);
});

describe('SessionHistory', () => {
  it('renders nothing when no sessions', async () => {
    mockSessionRepo.getRecent.mockResolvedValue([]);
    const { container } = render(<SessionHistory />);
    await waitFor(() => expect(mockSessionRepo.getRecent).toHaveBeenCalled());
    expect(container.firstChild).toBeNull();
  });

  it('renders session rows when sessions exist', async () => {
    mockSessionRepo.getRecent.mockResolvedValue([makeSession(), makeSession({ id: 2 })]);
    render(<SessionHistory />);
    await waitFor(() => expect(screen.getAllByTestId('session-row')).toHaveLength(2));
  });

  it('shows session size badge in KB', async () => {
    const doc = '# Test\n\nA '.repeat(200); // ~2 KB+
    mockSessionRepo.getRecent.mockResolvedValue([makeSession({ generatedDoc: doc })]);
    render(<SessionHistory />);
    await waitFor(() => expect(screen.getByText(/\d+ KB/)).toBeInTheDocument());
  });

  it('shows format, language pair, and aiBackend badges', async () => {
    mockSessionRepo.getRecent.mockResolvedValue([
      makeSession({ speakingLanguage: 'it', outputLanguage: 'en', format: 'wiki', aiBackend: 'gemini-nano' }),
    ]);
    render(<SessionHistory />);
    await waitFor(() => {
      expect(screen.getByText('it→en')).toBeInTheDocument();
      expect(screen.getByText('wiki')).toBeInTheDocument();
      expect(screen.getByText('gemini-nano')).toBeInTheDocument();
    });
  });

  it('delete button requires confirm — single click does not delete', async () => {
    mockSessionRepo.getRecent.mockResolvedValue([makeSession({ id: 10 })]);
    render(<SessionHistory />);
    await waitFor(() => screen.getByTestId('session-row'));

    fireEvent.click(screen.getByRole('button', { name: /delete session/i }));
    expect(mockSessionRepo.delete).not.toHaveBeenCalled();
    // confirm button should now show
    expect(screen.getByRole('button', { name: /confirm delete/i })).toBeInTheDocument();
  });

  it('delete removes row after double confirm click', async () => {
    mockSessionRepo.getRecent.mockResolvedValue([makeSession({ id: 10 })]);
    render(<SessionHistory />);
    await waitFor(() => screen.getByTestId('session-row'));

    const deleteBtn = screen.getByRole('button', { name: /delete session/i });
    fireEvent.click(deleteBtn);
    const confirmBtn = screen.getByRole('button', { name: /confirm delete/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => expect(mockSessionRepo.delete).toHaveBeenCalledWith(10));
    expect(screen.queryByTestId('session-row')).toBeNull();
  });

  it('calls onRestore with the session when restore button clicked', async () => {
    const session = makeSession({ id: 5 });
    mockSessionRepo.getRecent.mockResolvedValue([session]);
    const onRestore = vi.fn();
    render(<SessionHistory onRestore={onRestore} />);
    await waitFor(() => screen.getByTestId('session-row'));

    fireEvent.click(screen.getByRole('button', { name: /restore session/i }));
    expect(onRestore).toHaveBeenCalledWith(session);
  });

  it('expands session to show generated doc when chevron clicked', async () => {
    mockSessionRepo.getRecent.mockResolvedValue([makeSession()]);
    render(<SessionHistory />);
    await waitFor(() => screen.getByTestId('session-row'));

    fireEvent.click(screen.getByRole('button', { name: /expand/i }));
    expect(screen.getByText(/# Test Doc/)).toBeInTheDocument();
  });
});
