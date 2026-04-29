import '@testing-library/jest-dom';

// Mock localStorage (works in happy-dom and in @vitest-environment node where `window` may be absent)
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

const global_window = globalThis.window;
if (global_window !== undefined && global_window !== globalThis) {
  try {
    Object.defineProperty(global_window, 'localStorage', {
      value: localStorageMock,
      writable: true,
      configurable: true,
    });
  } catch {
    /* already configured */
  }
}
