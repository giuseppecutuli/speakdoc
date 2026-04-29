/** Default session title until the user renames (shown in Session History). */
export function build_default_session_name(created_at: Date): string {
  const date_part = created_at.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time_part = created_at.toLocaleTimeString(undefined, { timeStyle: 'short' });
  return `Session — ${date_part} ${time_part}`;
}

/** Default label for in-progress drafts in IndexedDB. */
export function build_default_draft_title(saved_at: Date): string {
  const date_part = saved_at.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time_part = saved_at.toLocaleTimeString(undefined, { timeStyle: 'short' });
  return `Draft — ${date_part} ${time_part}`;
}
