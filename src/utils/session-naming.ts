/** Default session title until the user renames (shown in Session History). */
export function buildDefaultSessionName(createdAt: Date): string {
  const datePart = createdAt.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = createdAt.toLocaleTimeString(undefined, { timeStyle: 'short' });
  return `Session — ${datePart} ${timePart}`;
}

/** Default label for in-progress drafts in IndexedDB. */
export function buildDefaultDraftTitle(savedAt: Date): string {
  const datePart = savedAt.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = savedAt.toLocaleTimeString(undefined, { timeStyle: 'short' });
  return `Draft — ${datePart} ${timePart}`;
}
