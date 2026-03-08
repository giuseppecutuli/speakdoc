# Technical Architecture
## Speak Doc — AI-Powered Documentation Tool

---

## System Overview

Fully client-side single-page application. No backend. All processing in the browser.

```
Browser (Chrome 123+)
├── React 18 + TypeScript + Vite
├── Speech Layer: ISpeechProvider (pluggable)
│   ├── WebSpeechProvider    → Web Speech API (default, real-time)
│   └── AssemblyAIProvider   → AssemblyAI cloud API (high accuracy, requires API key)
├── AI Layer: window.ai (Gemini Nano) → OpenAI-compatible API (fallback)
├── State: Zustand stores
├── Persistence: Dexie.js (IndexedDB) + localStorage
└── Output: Clipboard API + DOM formatters
```

---

## Module Architecture

```
src/
├── features/                    # Domain-driven modules
│   ├── language-selection/      # Language config + session gate
│   ├── voice-input/             # Recording + Web Speech API
│   ├── ai-integration/          # Gemini Nano + external API + fallback
│   ├── transcription/           # Real-time transcription display
│   ├── documentation-generation/# AI response → formatted docs
│   ├── learning/                # IndexedDB sessions + pattern analysis
│   └── export/                  # Copy/download output
│
├── components/                  # Shared UI (Layout, Nav, Settings)
├── hooks/                       # Cross-feature custom hooks
├── types/                       # TypeScript interfaces
├── constants/                   # Config, prompts, language codes
└── utils/                       # Pure utility functions
```

---

## Data Flow

```
User speaks (Italian)
    │
    ▼
[Web Speech API]
    │  SpeechRecognitionEvent (interim + final results)
    ▼
[Transcription Service]     ── speakingLanguage: 'it'
    │  string (Italian text)
    ▼
[Prompt Builder]            ── speakingLanguage + outputLanguage → system prompt
    │  { systemPrompt, userMessage }
    ▼
[AI Manager]
    ├── Try: window.ai.languageModel (Gemini Nano)
    └── Fallback: fetch(userConfig.apiEndpoint, { model, messages })
    │
    ▼
[Streaming Response]        ── chunk by chunk in English
    │
    ▼
[Documentation Generator]   ── applies formatter (Markdown / Wiki / HTML)
    │
    ▼
[Editor + Preview]          ── user can edit
    │
    ▼
[Export]                    ── navigator.clipboard.writeText()
    │
    ▼
[Session Storage]           ── Dexie.js → IndexedDB (async)
```

---

## State Management

Three Zustand stores, each isolated by domain:

### `useLanguageStore`
```typescript
{
  speakingLanguage: LanguageCode   // 'en' | 'it'
  outputLanguage: LanguageCode     // 'en' | 'it'
  sessionLocked: boolean           // true while recording
  setLanguages(speaking, output): void
  lockSession(): void
  unlockSession(): void
  loadFromStorage(): void          // restore from localStorage
}
```

### `useRecordingStore`
```typescript
{
  status: 'idle' | 'recording' | 'paused' | 'processing' | 'done'
  transcription: string            // live-updating Italian text
  audioBlob: Blob | null
  error: string | null
  startRecording(): Promise<void>
  pauseRecording(): void
  stopRecording(): Promise<void>
}
```

### `useDocumentationStore`
```typescript
{
  rawAIResponse: string
  formattedOutput: string
  selectedFormat: 'markdown' | 'wiki' | 'html'
  isGenerating: boolean
  setFormat(format): void
  generateFromTranscription(text: string): Promise<void>
  updateOutput(text: string): void  // user edits
}
```

---

## AI Integration Layer

### Gemini Nano (Primary)

```typescript
// Feature detection
const isAvailable = async (): Promise<boolean> => {
  if (!('ai' in window)) return false;
  const status = await window.ai?.languageModel?.canCreateTextSession();
  return status === 'readily' || status === 'after-download';
};

// Usage — compact prompt fits Gemini Nano's context budget
const session = await window.ai.languageModel.createTextSession({
  systemPrompt: buildCompactPrompt(speakingLang, outputLang),
});
const stream = session.promptStreaming(transcriptionText);
for await (const chunk of stream) { /* update UI */ }
```

### External API (Fallback)

OpenAI-compatible endpoint. Default: `http://localhost:1234/v1` (LM Studio).

```typescript
const response = await fetch(`${config.apiEndpoint}/chat/completions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`,
  },
  body: JSON.stringify({
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: transcriptionText },
    ],
    stream: true,
  }),
});
// Handle SSE stream...
```

### AI Manager (Orchestrator)

Two-tier prompt strategy: Gemini Nano gets compact prompts (no Mermaid, fits ~1k–4k token budget); external API gets full prompts (Mermaid diagrams, multi-section wiki structure).

```typescript
// ai-manager.service.ts
async function* generateDocumentation(transcription, speakingLanguage, outputLanguage) {
  if (await isGeminiNanoAvailable()) {
    const compactPrompt = buildCompactPrompt(speakingLanguage, outputLanguage);
    yield* generateWithGeminiNano(compactPrompt, transcription);
    return;
  }
  if (isExternalAPIConfigured()) {
    const systemPrompt = buildSystemPrompt(speakingLanguage, outputLanguage);
    yield* generateWithExternalAPI(systemPrompt, transcription);
    return;
  }
  throw new AINotConfiguredError('No AI backend available');
}
```

> ⚠️ Gemini Nano cannot reliably handle transcriptions longer than ~5 min (~600 words). For 10–15 min recordings, configure the external API backend.

---

## Language System

### Language Pair → System Prompt

Two prompt sets for the same 4 language pairs:

```typescript
// constants/prompts.ts

// FULL prompts — external API (large context, 8k–128k tokens)
// Includes: Mermaid diagrams, functional + technical wiki structure,
// explicit two-step translation for cross-language pairs.
export const SYSTEM_PROMPTS: Record<LanguagePair, string> = {
  'it→en': FULL_EN_FROM_IT,  // Step 1: translate IT→EN, Step 2: document
  'en→en': FULL_EN,          // Document directly in English
  'en→it': FULL_IT_FROM_EN,  // Step 1: translate EN→IT, Step 2: document
  'it→it': FULL_IT,          // Document directly in Italian
};

// COMPACT prompts — Gemini Nano (on-device, ~1k–4k token budget)
// No Mermaid. Minimal structure. Translation step still explicit.
export const COMPACT_PROMPTS: Record<LanguagePair, string> = {
  'it→en': COMPACT_EN_FROM_IT,
  'en→en': COMPACT_EN,
  'en→it': COMPACT_IT_FROM_EN,
  'it→it': COMPACT_IT,
};

export const buildSystemPrompt = (speaking: LanguageCode, output: LanguageCode): string =>
  SYSTEM_PROMPTS[`${speaking}→${output}`] ?? SYSTEM_PROMPTS['en→en'];

export const buildCompactPrompt = (speaking: LanguageCode, output: LanguageCode): string =>
  COMPACT_PROMPTS[`${speaking}→${output}`] ?? COMPACT_PROMPTS['en→en'];
```

Full prompts produce: `📑 Index` → `1. Functional Documentation` (business context, actors table, user stories, process flowchart, acceptance criteria) → `2. Technical Documentation` (architecture, class/sequence/ER diagrams, API contracts, dependencies, implementation notes) → `3. Action Items` → `4. Open Questions & Risks`.

### Web Speech API Integration

```typescript
const recognition = new window.SpeechRecognition();
recognition.lang = LANGUAGE_SPEECH_CODES[speakingLanguage]; // 'it-IT'
recognition.continuous = true;
recognition.interimResults = true;
recognition.onresult = (event) => { /* update transcription store */ };
```

---

## Speech Provider Layer — Pluggable Architecture

The voice-input feature uses a **pluggable provider abstraction** to support multiple speech-to-text backends. Switching between Web Speech API and whisper.cpp (WASM) requires no changes to component code.

### Provider Interface

```typescript
// src/features/voice-input/types/speech-provider.ts
export type SpeechProviderName = 'web-speech' | 'assemblyai';

export interface ISpeechProvider {
  readonly name: SpeechProviderName;
  isAvailable(): boolean;          // Synchronous feature detection
  isConfigured(): boolean;         // Synchronous config / API key check
  start(language: LanguageCode): void;
  stop(): void;
  abort(): void;
  onResult(callback: (result: TranscriptionResult) => void): void;
  onError(callback: (error: string) => void): void;
  onEnd(callback: () => void): void;
}
```

### Built-in Providers

#### WebSpeechProvider
- **Status**: Active (default)
- **Availability**: All modern browsers
- **Accuracy**: ~70–90% (browser-dependent)
- **Latency**: Real-time interim results
- **Config**: None required
- **Path**: `src/features/voice-input/providers/WebSpeechProvider.ts`

#### AssemblyAIProvider (cloud STT)
- **Status**: 🔲 Phase 1b replacement (replaces Whisper WASM)
- **Technology**: AssemblyAI REST API called directly from the browser via `assemblyai` npm SDK
- **Library**: `assemblyai` (browser-compatible; uses `fetch` internally)
- **Availability**: Any browser with `fetch` + `MediaRecorder` support; requires internet connection
- **Accuracy**: ~95–99% (universal-3-pro / universal-2 models)
- **Latency**: ~2–10 sec after recording stops (cloud processing)
- **Config**: User provides AssemblyAI API key in Settings (stored in localStorage)
- **Components**:
  - `src/features/voice-input/providers/AssemblyAIProvider.ts` — implements ISpeechProvider; MediaRecorder capture → blob → SDK transcription
  - `src/features/voice-input/assemblyai.service.ts` — wraps `client.transcripts.transcribe()`; handles language code mapping and error normalization
  - `src/constants/assemblyai-config.ts` — API models, language code mapping (`en`→`en_us`, `it`→`it_it`)
  - `src/components/AssemblyAIGuide.tsx` — collapsible step-by-step guide for obtaining an API key
- **Language mapping**: App codes (`en`/`it`) → AssemblyAI codes (`en_us`/`it_it`)
- **Models**: `universal-3-pro` (highest accuracy), `universal-2` (default, fast)
- **No model download**: API key is enough; no local binary, no IndexedDB model cache needed

> **Why AssemblyAI over Whisper WASM?** Whisper WASM required downloading 45–150 MB model files, was CPU-bound (5–30 sec on average hardware), and couldn't be interrupted. AssemblyAI delivers equivalent accuracy in 2–10 sec via cloud inference with no local setup beyond an API key.

### Provider Selection Logic

```typescript
// src/features/voice-input/SpeechProviderManager.ts
class SpeechProviderManager {
  // Accepts provider array in constructor for dependency injection (testing)
  constructor(providers: ISpeechProvider[] = [
    new WebSpeechProvider(),
    new AssemblyAIProvider(),
  ]) { ... }

  // User-preferred provider name comes from settings localStorage (Phase 1b)
  selectBestProvider(preferredName?: SpeechProviderName): ISpeechProvider {
    if (preferredName && preferredName !== 'auto') {
      const preferred = this.providers.find(p => p.name === preferredName);
      if (preferred?.isAvailable() && preferred.isConfigured()) return preferred;
    }
    // Fall back to first available + configured provider
    const available = this.providers.find(p => p.isAvailable() && p.isConfigured());
    if (!available) throw new Error('No speech provider available');
    return available;
  }

  start(language: LanguageCode, callbacks: SpeechCallbacks, preferredName?: SpeechProviderName): void { ... }
  stop(): void { ... }
  abort(): void { ... }
}
```

### Language Code Mapping

```typescript
// src/utils/language-utils.ts
export const getLanguageCodeForProvider = (
  language: LanguageCode,
  provider: SpeechProviderName,
): string => {
  switch (provider) {
    case 'assemblyai': return ASSEMBLYAI_LANGUAGE_MAP[language]; // 'en_us' | 'it_it'
    case 'web-speech':
    default:           return SUPPORTED_LANGUAGES[language].speechCode; // BCP 47 ('it-IT')
  }
};
```

### Settings Integration

**Phase 1b replacement — AssemblyAI:**

```typescript
// src/constants/config.ts
export const STORAGE_KEYS = {
  SPEECH_PROVIDER: 'speechProvider',           // 'web-speech' | 'assemblyai' | 'auto'
  ASSEMBLYAI_API_KEY: 'speak-doc:assemblyai-api-key',
  ASSEMBLYAI_MODEL: 'speak-doc:assemblyai-model', // 'universal-3-pro' | 'universal-2'
  // ... other keys
};

// src/constants/assemblyai-config.ts
export const ASSEMBLYAI_LANGUAGE_MAP: Record<LanguageCode, string> = {
  en: 'en_us',
  it: 'it_it',
};
export const ASSEMBLYAI_MODELS = ['universal-3-pro', 'universal-2'] as const;
export type AssemblyAIModel = typeof ASSEMBLYAI_MODELS[number];
export const DEFAULT_ASSEMBLYAI_MODEL: AssemblyAIModel = 'universal-2';
```

**UI in `src/components/Settings.tsx`:**
- Speech Recognition section with provider dropdown (Auto / Web Speech API / AssemblyAI)
- AssemblyAI API key input (shown when provider is `assemblyai` or `auto`)
- `AssemblyAIGuide` component — collapsible step-by-step instructions for getting an API key
- Active provider badge in recording UI

### Updated Data Flow

```
User selects language
    ↓
SpeechProviderManager.selectBestProvider()
    ├─ Check user preference
    ├─ Check WebAssembly availability (Whisper)
    └─ Fall back to Web Speech API
    ↓
provider.start(language)
    ↓
provider.onResult() → TranscriptionResult callbacks
    ├─ interim → update UI live  (Web Speech only; Whisper emits final only)
    └─ final   → accumulate transcript
    ↓
provider.onEnd() → Recording complete
    ↓
[Transcription → AI → Documentation]  (unchanged)
```

---

## Storage — Repository Pattern

The storage layer uses the **Repository Pattern** to decouple business logic from the storage backend. This makes switching from IndexedDB (MVP) to Supabase (future) a drop-in replacement.

### Interface (storage-agnostic)

```typescript
// src/features/learning/repositories/ISessionRepository.ts
export interface ISessionRepository {
  save(session: Omit<DocumentationSession, 'id'>): Promise<DocumentationSession>;
  getAll(): Promise<DocumentationSession[]>;
  getRecent(limit: number): Promise<DocumentationSession[]>;
  deleteOlderThan(date: Date): Promise<void>;
  clear(): Promise<void>;
}

export interface IFeedbackRepository {
  save(feedback: Omit<SessionFeedback, 'id'>): Promise<SessionFeedback>;
  getBySession(sessionId: number): Promise<SessionFeedback[]>;
}
```

### MVP Implementation — IndexedDB via Dexie

```typescript
// src/features/learning/repositories/IndexedDBSessionRepository.ts
import { db } from '@/utils/db';
export class IndexedDBSessionRepository implements ISessionRepository {
  save(session) { return db.sessions.add(session).then(id => ({ ...session, id })); }
  getAll()      { return db.sessions.toArray(); }
  getRecent(n)  { return db.sessions.orderBy('createdAt').reverse().limit(n).toArray(); }
  deleteOlderThan(d) { return db.sessions.where('createdAt').below(d).delete().then(() => {}); }
  clear()       { return db.sessions.clear(); }
}
```

### Future Implementation — Supabase

```typescript
// src/features/learning/repositories/SupabaseSessionRepository.ts
import { supabase } from '@/utils/supabase';
export class SupabaseSessionRepository implements ISessionRepository {
  async save(session) {
    const { data } = await supabase.from('sessions').insert(session).select().single();
    return data;
  }
  async getAll()      { const { data } = await supabase.from('sessions').select(); return data; }
  async getRecent(n)  { const { data } = await supabase.from('sessions').select().order('createdAt', { ascending: false }).limit(n); return data; }
  async deleteOlderThan(d) { await supabase.from('sessions').delete().lt('createdAt', d.toISOString()); }
  async clear()       { await supabase.from('sessions').delete().neq('id', 0); }
}
```

### Dependency Injection — Single Swap Point

```typescript
// src/utils/repositories.ts  ← THE ONLY FILE TO CHANGE when migrating
import { IndexedDBSessionRepository } from '@/features/learning/repositories/IndexedDBSessionRepository';
// import { SupabaseSessionRepository } from '@/features/learning/repositories/SupabaseSessionRepository';

export const sessionRepository: ISessionRepository = new IndexedDBSessionRepository();
// export const sessionRepository: ISessionRepository = new SupabaseSessionRepository();
```

All services consume `sessionRepository` from this file — never instantiate repositories directly.

---

## Storage Schema (Dexie.js / IndexedDB)

```typescript
class DocAssistantDB extends Dexie {
  sessions!: Table<DocumentationSession>;
  feedback!: Table<SessionFeedback>;
  drafts!: Table<SessionDraft>;               // Phase 6.2

  constructor() {
    super('DocAssistantDB');
    this.version(2).stores({
      sessions: '++id, speakingLanguage, outputLanguage, format, createdAt',
      feedback: '++id, sessionId, rating, createdAt',
    });
    this.version(3).stores({
      // sessions, feedback unchanged
      drafts: '++id, savedAt',               // Phase 6.2: single active draft
    });
    // Note: whisperModels table (v2) removed — AssemblyAI needs no local model cache
  }
}

interface DocumentationSession {
  id?: number;
  speakingLanguage: LanguageCode;
  outputLanguage: LanguageCode;
  transcription: string;
  generatedDoc: string;
  format: OutputFormat;
  aiBackend: 'gemini-nano' | 'external-api';
  createdAt: Date;
}

// Phase 6.2: Draft auto-save
interface SessionDraft {
  id?: number;
  transcription: string;
  generatedDoc: string;
  format: string;
  speakingLanguage: string;
  outputLanguage: string;
  audioBlob?: Blob;        // native Blob; omitted if > 25 MB
  savedAt: Date;
}

```

---

## Session Persistence & Restore (Phase 6)

### Overview

Two complementary mechanisms prevent users from losing their work:

1. **Phase 6.1 — Restore from history**: any completed session can be restored from `SessionHistory` into the active editor with a single click.
2. **Phase 6.2 — Draft auto-save**: the current in-progress working state (transcription + generated doc + audio blob) is continuously written to IndexedDB. On the next page load, if a recent draft is found, a restore banner appears.

### Phase 6.1 — Restore from Session History

```
SessionHistory (expanded row)
    └── [Restore] button → onRestore(session: DocumentationSession) callback
            ↓
App.tsx — handleRestoreSession()
    ├── useRecordingStore.setTranscription(session.transcription)
    ├── useDocumentationStore.setFormattedOutput(session.generatedDoc)
    ├── useDocumentationStore.setFormat(session.format)
    ├── useLanguageStore.setLanguages(session.speakingLanguage, session.outputLanguage)
    └── setShowLanguageModal(false)   // skip modal — language already known
```

### Phase 6.2 — Draft Auto-Save Architecture

```
useRecordingStore / useDocumentationStore (state change)
    ↓
useDraftPersistence hook (debounce 1 s)
    ├── Skip if transcription === '' && generatedDoc === ''
    ├── Omit audioBlob if > 25 MB
    └── draftRepository.save(draft)   → IndexedDB drafts table (clear + insert)

─────────────────────────────────────────────────────────

App mount (page load / refresh)
    ↓
draftRepository.getLatest()
    ├── No draft → normal startup
    └── Draft found AND savedAt < 24 h ago AND session empty
            ↓
        DraftRestoreBanner renders
            ├── [Restore] → populate all stores + set audioBlob
            └── [Discard] → draftRepository.clear(); hide banner
```

### New Files (Phase 6)

```
src/
  types/session.ts                              — SessionDraft interface added
  utils/db.ts                                   — version 3 with drafts table
  utils/repositories.ts                         — exports draftRepository
  features/learning/repositories/
    IDraftRepository.ts                         — save / getLatest / clear
    IndexedDBDraftRepository.ts                 — Dexie implementation
  hooks/
    useDraftPersistence.ts                      — debounced auto-save hook
  components/
    DraftRestoreBanner.tsx                      — startup restore/discard banner
```

### IDraftRepository Interface

```typescript
export interface IDraftRepository {
  save(draft: Omit<SessionDraft, 'id'>): Promise<SessionDraft>;
  getLatest(): Promise<SessionDraft | undefined>;
  clear(): Promise<void>;
}
```

Only one draft is stored at a time. `IndexedDBDraftRepository.save()` clears the table before inserting, ensuring exactly one row.

### Audio Blob Handling

IndexedDB natively supports `Blob` storage — no base64 encoding required. The draft includes `audioBlob` only when the blob size is ≤ 25 MB. This avoids quota issues while still restoring audio for the common case (< 5 min recordings ≈ 5–15 MB).

### Draft Lifecycle

| Event | Effect |
|---|---|
| User types / doc generates | Auto-save fires (debounced 1 s) |
| User clicks Regenerate / reset | `useDraftPersistence` detects empty state → `draftRepository.clear()` |
| User restores from banner | Stores populated; banner hidden; draft NOT cleared (allows re-restore) |
| User discards banner | `draftRepository.clear()`; banner hidden |
| Draft > 24 h old | Banner not shown; draft is stale |

---

## AI Inline Editing

### Overview

Extends the `DocumentationEditor` with the ability to improve selected text (or the full document) via an AI prompt, and tracks edit history for undo/redo.

### Components

```
src/features/documentation-generation/
  ├── inline-improvement.service.ts     — improveSelection() + improveDocument() generators
  ├── SelectionImprovementPopover.tsx   — floating toolbar shown on textarea selection
  └── DocumentImprovementModal.tsx      — modal for whole-document improvement

src/constants/
  └── improvement-prompts.ts            — buildSelectionImprovementPrompt() + buildDocumentImprovementPrompt()

src/hooks/
  └── useDocumentationStore.ts          — extended with history[], historyIndex, undo(), redo(), pushHistory()
```

### Inline Selection Flow

```
User selects text in textarea (Markdown or Wiki tab)
    ↓
onSelect → read selectionStart / selectionEnd
    ↓
SelectionImprovementPopover appears (position: fixed, above selection)
    ↓
User types instruction → submits
    ↓
pushHistory(currentContent)          ← snapshot before edit
improveSelection(selectedText, instruction, outputLang)
    ↓
Stream result → replace [selectionStart, selectionEnd] range inline
    ↓
"Undo" button enabled in toolbar
```

### Whole-Document Flow

```
User clicks "Improve Doc" in toolbar
    ↓
DocumentImprovementModal opens
    ↓
User types instruction → submits
    ↓
pushHistory(currentContent)
improveDocument(fullContent, instruction, outputLang)
    ↓
Stream result → replace full editor content
    ↓
"Undo" button enabled
```

### Improvement Prompts Strategy

- **Selection scope**: System prompt instructs AI to rewrite ONLY the provided excerpt and return ONLY the rewritten text (no preamble, no explanation). Context is minimal to stay within Gemini Nano's token budget.
- **Document scope**: System prompt instructs AI to improve the entire document per the instruction and return ONLY the improved document.
- Both use the same two-tier approach (compact prompt for Gemini Nano, full prompt for external API) as the main generation prompts.

### Revision History

```typescript
// useDocumentationStore.ts additions
history: string[];          // past snapshots, max 20 entries
historyIndex: number;       // current position in history
pushHistory(content): void  // snapshot before AI edit; trims to 20
undo(): void                // restore history[historyIndex - 1]
redo(): void                // restore history[historyIndex + 1]
canUndo: boolean            // historyIndex > 0
canRedo: boolean            // historyIndex < history.length - 1
```

History is **session-scoped** (in-memory only). It resets on `reset()` and is not persisted to IndexedDB.

### Constraints

| Constraint | Reason |
|---|---|
| HTML Preview tab: inline editing disabled | `dangerouslySetInnerHTML` has no selection API; read-only is acceptable |
| Instruction max 500 chars | Keeps token budget predictable for Gemini Nano |
| History cap at 20 snapshots | Prevents unbounded memory use; each snapshot is a plain string |
| Popover dismissed on scroll / Escape | Prevents stale position after scroll |

---

## Output Formatters

All formatters receive the raw AI response (English Markdown-ish text) and transform it.

```typescript
// Confluence Wiki Markup
export const toWikiMarkup = (markdown: string): string => {
  return markdown
    .replace(/^# (.+)$/gm, 'h1. $1')
    .replace(/^## (.+)$/gm, 'h2. $1')
    .replace(/^- (.+)$/gm, '* $1')
    .replace(/\*\*(.+?)\*\*/g, '*$1*')
    .replace(/`(.+?)`/g, '{{$1}}');
};

// Markdown (pass-through, AI outputs Markdown naturally)
export const toMarkdown = (text: string): string => text;

// HTML (for preview)
export const toHTML = (markdown: string): string => {
  // Use lightweight marked.js or manual conversion
};
```

---

## Testing Strategy

```
Unit Tests (Vitest):
  ├── language.service.test.ts     — BCP 47 mapping, prompt building
  ├── ai-manager.test.ts           — Gemini Nano detection, fallback
  ├── formatters.test.ts           — Markdown/Wiki/HTML conversion
  ├── learning-engine.test.ts      — Pattern detection, suggestions
  └── recording.service.test.ts   — Audio buffer, state transitions

Integration Tests (Vitest + MSW):
  ├── ai-pipeline.test.ts          — Transcription → AI → formatted doc
  ├── language-flow.test.ts        — Language selection → locked → recording
  └── storage.test.ts              — Session storage → retrieval

E2E Tests (Playwright):
  ├── record-and-export.e2e.ts     — Full happy path
  ├── fallback-api.e2e.ts          — Gemini Nano unavailable → external API
  └── language-switch.e2e.ts      — Multiple sessions with different langs
```

---

## Deployment

Static files only. Deploy to:

```bash
npm run build           # Output: doc-assistant/dist/
```

| Platform | Command | Cost |
|---|---|---|
| Vercel | `vercel deploy` | Free tier |
| Netlify | `netlify deploy` | Free tier |
| GitHub Pages | `gh-pages -d dist` | Free |
| Self-hosted | Serve `dist/` as static files | Own infra |

---

## Browser Compatibility

| Browser | Web Speech | AssemblyAI | Gemini Nano | External API | Notes |
|---|---|---|---|---|---|
| Chrome 123+ | ✓ | ✓ | ✓ (flag needed) | ✓ | Full support |
| Chrome < 123 | ✓ | ✓ | ✗ | ✓ | No built-in AI |
| Edge (Chromium) | ✓ | ✓ | ✗ | ✓ | No Gemini Nano |
| Firefox | ✓ | ✓ | ✗ | ✓ | Web Speech limited |
| Safari | ⚠ | ✓ | ✗ | ✓ | iOS restrictions on Web Speech; AssemblyAI works |

> **AssemblyAI** works in any browser with `fetch` + `MediaRecorder` support (all modern browsers). Requires an internet connection and a user-provided API key. No model downloads needed.
