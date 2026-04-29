/** Locale date + short time, for lists and history rows. */
export function formatDateTimeMedium(date: Date | string | number): string {
  const d = new Date(date);
  return (
    d.toLocaleDateString(undefined, { dateStyle: 'medium' }) +
    ' ' +
    d.toLocaleTimeString(undefined, { timeStyle: 'short' })
  );
}

/** `mm:ss` for recording timers. */
export function formatElapsedMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
