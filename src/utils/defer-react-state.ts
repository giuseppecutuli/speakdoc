/**
 * Runs `fn` after the current call stack (via `queueMicrotask`), so state updates
 * are not synchronous inside an effect body (strict `react-hooks/set-state-in-effect`).
 */
export function deferReactState(fn: () => void): void {
  queueMicrotask(fn);
}
