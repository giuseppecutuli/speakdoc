# Agent: Frontend Developer

## Role
Handles all React/TypeScript UI: language selection, voice recording, waveform, documentation editor, formatters, and visual polish.

## Key Areas
- Language selection modal (before recording gate)
- Web Speech API + MediaRecorder API
- Documentation formatters: Markdown → Confluence Wiki Markup / HTML
- shadcn/ui components, Tailwind, dark mode, accessibility

## Critical Patterns

### Language Selection
```typescript
// Zustand store — lock on record start, unlock on stop
const { speakingLanguage, outputLanguage, sessionLocked, lockSession } = useLanguageStore();
// speakingLanguage 'it' → Web Speech API lang: 'it-IT'
const SPEECH_CODES = { en: 'en-US', it: 'it-IT' };
```

### Web Speech API
```typescript
const recognition = new window.SpeechRecognition();
recognition.lang = SPEECH_CODES[speakingLanguage];
recognition.continuous = true;
recognition.interimResults = true;
// Always cleanup: return () => recognition.stop(); in useEffect
```

### Waveform
```typescript
// Web Audio API AnalyserNode → requestAnimationFrame → canvas draw
const analyser = audioContext.createAnalyser();
mediaStream.connect(analyser);
```

### Confluence Wiki Formatter
```typescript
export const toWikiMarkup = (md: string) =>
  md.replace(/^# (.+)$/gm, 'h1. $1')
    .replace(/^## (.+)$/gm, 'h2. $1')
    .replace(/^- (.+)$/gm, '* $1')
    .replace(/\*\*(.+?)\*\*/g, '*$1*')
    .replace(/`(.+?)`/g, '{{$1}}')
    .replace(/```[\w]*\n([\s\S]*?)```/g, '{code}\n$1{code}');
```

### Copy to Clipboard
```typescript
await navigator.clipboard.writeText(text); // with fallback for older browsers
```

## Test Mocks
```typescript
// Web Speech API
const mock = { lang: '', continuous: false, start: vi.fn(), stop: vi.fn(), onresult: null };
vi.stubGlobal('SpeechRecognition', vi.fn(() => mock));

// Clipboard
Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });

// MediaRecorder
vi.stubGlobal('MediaRecorder', vi.fn(() => ({
  start: vi.fn(), stop: vi.fn(), state: 'inactive', ondataavailable: null,
})));
```

## Design System (Tailwind)

### Color Tokens — `tailwind.config.ts`
```js
colors: {
  brand:     { 50:'#f0f9ff', 100:'#e0f2fe', 500:'#0ea5e9', 600:'#0284c7', 700:'#0369a1' },
  recording: { DEFAULT:'#ef4444', glow:'#fca5a5' },
  success:   '#22c55e',
}
animation: { 'pulse-slow': 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }
```

### App Layout
```
┌──────────────────────────────────────────────┐
│ Header: logo · AI status badge · ⚙ Settings  │
├──────────────┬───────────────────────────────┤
│ LEFT (w-80)  │ RIGHT (flex-1)                │
│ Language     │ [Markdown | Wiki | HTML] tabs  │
│ cards        │ <textarea> (editable)          │
│ ──────────── │ Live HTML preview              │
│ Rec button   │ [Copy ✓] [↺ Regen]            │
│ Waveform     │ ────────────────────────────── │
│ Transcript   │ Learning suggestions panel     │
└──────────────┴───────────────────────────────┘
```
Base: `min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100`

### Recording Button States
```tsx
// idle — brand blue
"w-20 h-20 rounded-full bg-brand-500 hover:bg-brand-600
 shadow-lg shadow-brand-500/30 transition-all duration-200"

// recording — red pulse ring
"w-20 h-20 rounded-full bg-recording
 shadow-lg shadow-red-500/40 animate-pulse-slow
 ring-4 ring-red-400/30 ring-offset-2"
```

### Waveform Canvas
- Container: `bg-slate-800 dark:bg-slate-950 rounded-xl w-full h-16`
- Bar fill: `rgba(14,165,233,0.8)` (idle) → `rgba(239,68,68,0.8)` (recording)
- Use ResizeObserver to keep canvas width in sync

### Language Selector Cards
```tsx
cn("flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all",
   selected
     ? "border-brand-500 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300"
     : "border-slate-200 dark:border-slate-700 hover:border-brand-300")
```

### Documentation Tabs
- Tab bar: `flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg`
- Active: `bg-white dark:bg-slate-700 shadow-sm rounded-md px-3 py-1.5 text-sm font-medium`

### Copy Button Feedback
```tsx
// Toggle Copied ✓ state for 2 s, animate with transition-colors
cn("px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
   copied ? "bg-success text-white" : "bg-brand-500 hover:bg-brand-600 text-white")
```

### Streaming Text Cursor
```css
/* index.css */
@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
.streaming-cursor::after { content:'▋'; animation: blink 1s step-end infinite; }
```

### Dark Mode
- Toggle: add/remove `class="dark"` on `<html>`, persist to `localStorage('theme')`
- All cards: `bg-white dark:bg-slate-800`

### Accessibility
- Buttons: `focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none`
- Rec button: `aria-label` + `aria-pressed`
- Language cards: `role="radio"` + `aria-checked`
- Transcript: `aria-live="polite" aria-atomic="false"`

## Checklist
- [ ] Language modal tested (render, dropdowns, persistence, lock)
- [ ] Recording states: idle → recording → stopped with animated transitions
- [ ] Speech API uses correct BCP 47 code per language
- [ ] Wiki markup passes Confluence syntax validation
- [ ] HTML output sanitized (no XSS)
- [ ] Copy to clipboard shows animated Copied ✓ feedback
- [ ] Waveform color changes red during recording
- [ ] Dark mode works on all components
- [ ] All interactive elements keyboard-navigable (Tab/Enter/Esc)
- [ ] `aria-live` region for transcript
- [ ] Coverage ≥ 80% (AI layer + formatters only)
