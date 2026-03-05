import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';

vi.mock('@/features/documentation-generation/inline-improvement.service', () => ({
  improveDocument: vi.fn(),
}));

import { improveDocument } from '@/features/documentation-generation/inline-improvement.service';
import { DocumentImprovementModal } from '@/features/documentation-generation/DocumentImprovementModal';

async function* makeGen(chunks: string[]): AsyncGenerator<string> {
  for (const chunk of chunks) yield chunk;
}

beforeEach(() => {
  vi.resetAllMocks();
  useDocumentationStore.getState().reset();
});

describe('DocumentImprovementModal', () => {
  it('renders instruction textarea and Improve button when open', () => {
    render(
      <DocumentImprovementModal
        open={true}
        onOpenChange={vi.fn()}
        content="# Doc\n\nContent"
        onContentChange={vi.fn()}
      />,
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/improvement instruction/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /apply document improvement/i })).toBeInTheDocument();
  });

  it('does not render when open is false', () => {
    render(
      <DocumentImprovementModal
        open={false}
        onOpenChange={vi.fn()}
        content="# Doc"
        onContentChange={vi.fn()}
      />,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('calls improveDocument and invokes onContentChange with improved text', async () => {
    vi.mocked(improveDocument).mockReturnValue(makeGen(['# Doc\n\nImproved content']));
    const onContentChange = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <DocumentImprovementModal
        open={true}
        onOpenChange={onOpenChange}
        content={"# Doc\n\nOriginal content"}
        onContentChange={onContentChange}
      />,
    );

    fireEvent.change(screen.getByLabelText(/improvement instruction/i), {
      target: { value: 'be concise' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /apply document improvement/i }));
    });

    expect(improveDocument).toHaveBeenCalledWith('# Doc\n\nOriginal content', 'be concise', 'en');
    expect(onContentChange).toHaveBeenCalledWith('# Doc\n\nImproved content');
  });

  it('disables Improve button when instruction is empty', () => {
    render(
      <DocumentImprovementModal
        open={true}
        onOpenChange={vi.fn()}
        content="# Doc"
        onContentChange={vi.fn()}
      />,
    );
    const btn = screen.getByRole('button', { name: /apply document improvement/i });
    expect(btn).toBeDisabled();
  });

  it('shows character count', () => {
    render(
      <DocumentImprovementModal
        open={true}
        onOpenChange={vi.fn()}
        content="# Doc"
        onContentChange={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText(/improvement instruction/i), {
      target: { value: 'hello' },
    });
    expect(screen.getByText('5/500')).toBeInTheDocument();
  });
});
