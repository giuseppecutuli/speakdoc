import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useDocumentationStore } from '@/hooks/useDocumentationStore';

// Mock inline-improvement service
vi.mock('@/features/documentation-generation/inline-improvement.service', () => ({
  improveSelection: vi.fn(),
}));

import { improveSelection } from '@/features/documentation-generation/inline-improvement.service';
import { SelectionImprovementPopover } from '@/features/documentation-generation/SelectionImprovementPopover';
import { createRef } from 'react';

async function* makeGen(chunks: string[]): AsyncGenerator<string> {
  for (const chunk of chunks) yield chunk;
}

function makeTextarea(value: string, selStart: number, selEnd: number) {
  const ref = createRef<HTMLTextAreaElement>();
  const el = document.createElement('textarea');
  el.value = value;
  Object.defineProperty(el, 'selectionStart', { value: selStart, writable: true });
  Object.defineProperty(el, 'selectionEnd', { value: selEnd, writable: true });
  Object.defineProperty(el, 'getBoundingClientRect', {
    value: () => ({ top: 100, left: 50, width: 400, height: 200 }),
  });
  document.body.appendChild(el);
  (ref as React.MutableRefObject<HTMLTextAreaElement>).current = el;
  return ref;
}

beforeEach(() => {
  vi.resetAllMocks();
  useDocumentationStore.getState().reset();
  // Clean up any textarea elements
  document.querySelectorAll('textarea').forEach((el) => el.remove());
});

describe('SelectionImprovementPopover', () => {
  it('does not render popover when there is no selection', () => {
    const ref = createRef<HTMLTextAreaElement>();
    (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = null;
    const { container } = render(
      <SelectionImprovementPopover
        textareaRef={ref}
        content="hello world"
        onContentChange={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('shows popover when textarea fires select event with valid selection', () => {
    const ref = makeTextarea('hello world text here', 0, 11);
    render(
      <SelectionImprovementPopover
        textareaRef={ref}
        content="hello world text here"
        onContentChange={vi.fn()}
      />,
    );

    act(() => {
      ref.current!.dispatchEvent(new Event('select'));
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/instruction/i)).toBeInTheDocument();
  });

  it('hides popover when selection is shorter than 3 chars', () => {
    const ref = makeTextarea('hi world', 0, 2);
    render(
      <SelectionImprovementPopover
        textareaRef={ref}
        content="hi world"
        onContentChange={vi.fn()}
      />,
    );

    act(() => {
      ref.current!.dispatchEvent(new Event('select'));
    });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('dismisses popover on Escape key', () => {
    const ref = makeTextarea('hello world text', 0, 11);
    render(
      <SelectionImprovementPopover
        textareaRef={ref}
        content="hello world text"
        onContentChange={vi.fn()}
      />,
    );

    act(() => {
      ref.current!.dispatchEvent(new Event('select'));
    });

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    act(() => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('calls improveSelection and replaces content slice on submit', async () => {
    vi.mocked(improveSelection).mockReturnValue(makeGen(['FORMAL']));
    const onContentChange = vi.fn();
    const ref = makeTextarea('hello world text', 0, 5);
    render(
      <SelectionImprovementPopover
        textareaRef={ref}
        content="hello world text"
        onContentChange={onContentChange}
      />,
    );

    act(() => {
      ref.current!.dispatchEvent(new Event('select'));
    });

    const input = screen.getByPlaceholderText(/instruction/i);
    fireEvent.change(input, { target: { value: 'make formal' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /apply improvement/i }));
    });

    expect(improveSelection).toHaveBeenCalledWith('hello', 'make formal', expect.any(String));
    expect(onContentChange).toHaveBeenCalledWith('FORMAL world text');
  });

  it('clamps instruction to 500 characters', () => {
    const ref = makeTextarea('hello world text', 0, 11);
    render(
      <SelectionImprovementPopover
        textareaRef={ref}
        content="hello world text"
        onContentChange={vi.fn()}
      />,
    );

    act(() => {
      ref.current!.dispatchEvent(new Event('select'));
    });

    const input = screen.getByPlaceholderText(/instruction/i) as HTMLInputElement;
    const longText = 'a'.repeat(600);
    fireEvent.change(input, { target: { value: longText } });

    expect(input.value).toHaveLength(500);
  });
});
