# speakdoc

> Record your voice → AI generates structured technical documentation → copy to Confluence or Notion.

No backend. No server. Everything runs in the browser.

---

## What it does

1. **Select languages** — choose your speaking language and the documentation output language independently (English / Italian)
2. **Record** — speak naturally; transcription is either **live** (Web Speech API) or **after stop** (AssemblyAI cloud batch), depending on Settings (see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md))
3. **Generate** — AI produces a structured wiki-style document with functional + technical sections, Mermaid diagrams, action items, and open questions
4. **Edit** — select any text in the editor to rewrite it with an inline AI instruction; undo/redo full revision history
5. **Copy** — paste directly into Confluence (wiki markup), Notion (Markdown), or any editor (HTML preview)

### Additional features

- **Documentation templates** — Generic, Meeting Notes, Tech Spec, ADR, Bug Report
- **AssemblyAI** (optional) — high-accuracy batch transcription for mic (after recording) and audio file import; API key in Settings
- **Session history** — completed sessions in IndexedDB with default titles, rename, restore, optional **saved mic audio** + download
- **In-progress drafts** — autosaved work with a **Draft — …** title; list, restore, or delete from the main screen
- **Dark mode** — toggle in the header, persisted to localStorage
- **Keyboard shortcuts** — `Space` to start/stop recording, `Ctrl+S` to download

Technical detail for contributors: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/TASKS.md](docs/TASKS.md), [docs/PRD.md](docs/PRD.md), and [CLAUDE.md](CLAUDE.md) (agent-oriented).

---

## AI Backends

| Backend | When used | Context |
|---|---|---|
| Gemini Nano (`window.ai`) | Chrome 127+ with on-device AI flag | ~4k tokens — good for short recordings (≤5 min) |
| External API (OpenAI-compatible) | Configured in Settings | 8k–128k tokens — suitable for 10–15 min recordings |

Gemini Nano is tried first; falls back to the configured external API (default: LM Studio at `localhost:1234`).

---

## Language Pairs

| Speaking | Output | Notes |
|---|---|---|
| Italian | English | Translates first, then documents |
| English | English | Documents directly |
| English | Italian | Translates first, then documents |
| Italian | Italian | Documents directly in Italian |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Start / Stop recording |
| `Ctrl+S` / `Cmd+S` | Download documentation as file |
| `Esc` | Close modals |

---

## Stack

- **React 19 + TypeScript + Vite**
- **Zustand** — state management
- **Dexie.js** — IndexedDB session storage
- **Tailwind CSS v4** — UI
- **Radix UI** — accessible primitives
- **Vitest** — unit tests
- **Web Speech API** — optional live mic transcription
- **assemblyai** — cloud batch STT (mic after stop + file import)
- **Web Audio API** — waveform visualizer

---

## Getting Started

```bash
npm install
npm run dev        # http://localhost:5173
```

### Enable Gemini Nano (Chrome)

1. Open `chrome://flags/#optimization-guide-on-device-model`
2. Set to **Enabled BypassPerfRequirement**
3. Open `chrome://flags/#prompt-api-for-gemini-nano`
4. Set to **Enabled**
5. Restart Chrome

### Use external API (LM Studio / OpenAI)

1. Open **Settings** in the app
2. Set your API endpoint (e.g. `http://localhost:1234/v1`)
3. Optionally set an API key and model name

---

## Development

```bash
npm run dev          # dev server
npm run build        # production build (tsc + vite)
npm test             # unit tests (vitest)
npm run test:watch   # watch mode
npm run lint         # eslint
```

---

## Project Structure

```
src/
  features/
    language-selection/   # Language modal + Zustand store
    voice-input/          # Web Speech + AssemblyAI batch + waveform + speech-preference
    ai-integration/       # Gemini Nano + external API + fallback
    transcription/        # Live transcription display
    documentation-generation/  # Formatters (Markdown / Wiki / HTML)
    learning/             # IndexedDB sessions + pattern analysis
    export/               # Clipboard export
  components/             # Shared UI
  hooks/                  # Cross-feature hooks
  types/                  # TypeScript interfaces
  constants/              # Prompts, language codes, config
  utils/                  # Pure utilities + repository DI
docs/
  ARCHITECTURE.md         # Technical architecture
  TASKS.md                # Phase-by-phase task list
  PRD.md                  # Product requirements
```

---

## Deploy

Static files only — deploy anywhere:

```bash
npm run build   # output: dist/
```

| Platform | Command |
|---|---|
| Vercel | `vercel deploy` |
| Netlify | `netlify deploy` |
| GitHub Pages | `gh-pages -d dist` |

---

## License

MIT
