# Task Breakdown
## Speak Doc — Phase-by-Phase Implementation

**Convention:** Each task includes the responsible agent from `.claude/agents/`.

> **MVP Testing Policy:** Unit tests only for AI layer and formatters. Skip E2E and component tests. Test UI manually in Chrome.

---

## Phase 1 — Foundation + Language Selection + Voice Input (Week 1-2)

### 1.1 Project Setup
- [x] Initialize Vite + React 18 + TypeScript project
- [x] Configure Tailwind CSS + shadcn/ui
- [x] Set up Vitest + React Testing Library + Playwright
- [x] Configure ESLint + Prettier
- [x] Create `src/` folder structure (features, components, hooks, types, constants, utils)
- [x] Create `public/data/languages.json` and `public/data/speech-codes.json`

**Agent:** `frontend-dev` (scaffold tests first, then setup)

### 1.2 Type Definitions
- [x] `src/types/language.ts` — `LanguageCode`, `LanguageConfig`, `LanguageSession`
- [x] `src/types/voice.ts` — `RecordingStatus`, `TranscriptionResult`
- [x] `src/types/session.ts` — `DocumentationSession`, `SessionFeedback`
- [x] `src/types/ai.ts` — `AIBackend`, `AIConfig`, `GenerationOptions`
- [x] `src/types/documentation.ts` — `OutputFormat`, `DocumentationOutput`

**Agent:** `frontend-dev`

### 1.3 Constants + Language Config
- [x] `src/constants/languages.ts` — Supported languages map (en, it)
- [x] `src/constants/speech-recognition-codes.ts` — BCP 47 codes per language
- [x] `src/utils/bcp47.utils.ts` — Language code normalization
- [x] `src/utils/language-utils.ts` — Language support detection
- [x] `src/utils/feature-detection.ts` — Detect Web Speech API availability

**Agent:** `frontend-dev`

### 1.4 Language Selection Feature
- [x] `src/features/language-selection/LanguageSelectionModal.tsx` — Modal UI with dropdowns
- [x] `src/features/language-selection/LanguageProvider.tsx` — Context/store connection
- [x] `src/features/language-selection/language.service.ts` — Load/save language preferences
- [x] `src/hooks/useLanguage.ts` — Zustand store (speakingLang, outputLang, locked)
- [x] Unit tests for all above (RED → GREEN)
- [x] Language persists to localStorage
- [x] Lock mechanism tested (cannot change during recording)

**Agent:** `frontend-dev`

### 1.5 Voice Input Feature
- [x] `src/features/voice-input/recorder.service.ts` — MediaRecorder wrapper
- [x] `src/features/voice-input/speech-recognition.service.ts` — Web Speech API wrapper, language-aware
- [x] `src/features/voice-input/VoiceRecorder.tsx` — Record button, status, waveform
- [x] `src/features/voice-input/waveform-visualizer.ts` — Web Audio API canvas viz
- [x] `src/hooks/useVoiceRecorder.ts` — Zustand recording store
- [x] Unit tests: recording states, speech API language codes, error handling
- [x] Integration test: language selection → recording starts with correct language code

**Agent:** `frontend-dev`

### 1.6 Transcription Display
- [x] `src/features/transcription/TranscriptionDisplay.tsx` — Real-time text panel
- [x] `src/features/transcription/transcriber.service.ts` — Buffer interim + final results
- [x] Unit tests: transcript buffering, language label display

**Agent:** `frontend-dev`

### Phase 1 Exit Criteria
- [x] Language modal appears before recording
- [x] Can select Italian → English
- [x] Languages locked during recording
- [x] Voice recording works with waveform
- [x] Live transcription updates in real-time
- [x] All tests pass, coverage ≥ 80%

---

## Phase 1a — Speech Provider Abstraction (Week 2, parallel with Phase 2)

_Refactors the existing Web Speech API usage into a pluggable provider pattern. No user-facing changes. Unlocks Phase 1b (Whisper WASM) without blocking Phase 2–5._

### 1a.1 Define ISpeechProvider Interface
- [x] `src/features/voice-input/types/speech-provider.ts` — `ISpeechProvider` interface
- [x] Fields: `name`, `isAvailable()`, `isConfigured()`, `start()`, `stop()`, `abort()`, `onResult()`, `onError()`, `onEnd()`
- [x] Unit tests: interface contract (TypeScript compile-time verification)

**Agent:** `frontend-dev` | **Complexity:** LOW | **Risk:** LOW

### 1a.2 WebSpeechProvider — Adapter
- [x] `src/features/voice-input/providers/WebSpeechProvider.ts` — wraps existing `speech-recognition.service.ts`
- [x] Implements `ISpeechProvider`; delegates to existing service (no internal refactor)
- [x] Unit tests: callback invocation, error propagation

**Agent:** `frontend-dev` | **Complexity:** LOW | **Risk:** LOW

### 1a.3 SpeechProviderManager
- [x] `src/features/voice-input/SpeechProviderManager.ts` — orchestrator + fallback chain
- [x] `selectBestProvider(preferredName?)` → checks user preference → availability → fallback
- [x] Accepts provider array in constructor (dependency injection for testing)
- [x] Unit tests: user-preference selection, fallback chain, no-provider error

**Agent:** `frontend-dev` | **Complexity:** LOW | **Risk:** LOW

### 1a.4 Wire VoiceRecorder to SpeechProviderManager
- [x] Update `src/features/voice-input/VoiceRecorder.tsx` to use `SpeechProviderManager` instead of direct service call
- [x] All existing Phase 1 tests must still pass (regression check mandatory)

**Agent:** `frontend-dev` | **Complexity:** LOW | **Risk:** MEDIUM (regression)

### 1a.5 Language Code Mapping Utility
- [x] Create `src/utils/language-utils.ts` — `getLanguageCodeForProvider(language, provider)`
- [x] Web Speech → BCP 47 (`'it-IT'`); Whisper → ISO 639-1 (`'it'`)
- [x] Unit tests: all language codes for both provider types

**Agent:** `frontend-dev` | **Complexity:** LOW | **Risk:** LOW

### Phase 1a Exit Criteria
- [x] `ISpeechProvider` interface defined and exported
- [x] `WebSpeechProvider` adapts existing service (no regression)
- [x] `SpeechProviderManager` selects provider correctly
- [x] `VoiceRecorder` uses manager
- [x] Language code mapping covers all language codes
- [x] All Phase 1 tests still pass
- [x] New tests pass; coverage ≥ 80% (87 tests passing)

---

## Phase 1b — Whisper WASM Provider (post-MVP, optional)

_Add offline, high-accuracy speech-to-text via whisper.cpp running in the browser as WebAssembly. Requires Phase 1a to be complete. Can be started independently of Phase 2–5._

> **Feasibility**: ✅ Fully feasible. `@xenova/transformers` ships pre-compiled Whisper WASM bundles. No backend or native binary needed — runs entirely in the browser tab.

### 1b.1 Evaluate & Prototype WASM Library
- [ ] Evaluate `@xenova/transformers` (recommended): bundle size, language support, model formats, maintenance
- [ ] Prototype: load `Xenova/whisper-tiny` model, transcribe a short audio Blob
- [ ] Benchmark accuracy vs Web Speech API on Italian and English samples
- [ ] Document chosen API surface

**Agent:** `ai-integration-dev` | **Complexity:** MEDIUM | **Risk:** MEDIUM

### 1b.2 WhisperProvider Implementation
- [ ] `src/features/voice-input/providers/WhisperProvider.ts` — implements `ISpeechProvider`
- [ ] `isAvailable()` → `typeof WebAssembly !== 'undefined'`
- [ ] `isConfigured()` → lazy-loads WASM pipeline with progress callback
- [ ] `start()` → uses `MediaRecorder` to capture audio Blob, then transcribes
- [ ] Emits `TranscriptionResult` (final only — no interim results from Whisper)
- [ ] Error handling: network failure, model download timeout, WASM crash
- [ ] Unit tests: availability detection, model loading (mocked WASM), error states

**Agent:** `ai-integration-dev` | **Complexity:** HIGH | **Risk:** HIGH

### 1b.3 Whisper Model Cache (IndexedDB)
- [ ] `src/features/voice-input/whisper-model-cache.ts` — cache WASM model binary in IndexedDB
- [ ] On first use: download → show progress → store in Dexie
- [ ] Subsequent uses: load from cache (no network request)
- [ ] Storage quota check; graceful degradation if quota exceeded
- [ ] Unit tests: save/load, quota handling

**Agent:** `learning-engine-dev` | **Complexity:** MEDIUM | **Risk:** MEDIUM

### 1b.4 Model Download Progress UI
- [ ] `src/features/voice-input/WhisperProgressModal.tsx` — shows download % and model size
- [ ] Displayed on first Whisper use; dismissible (retries on next recording)
- [ ] Friendly error message if download fails (suggest Web Speech API fallback)

**Agent:** `frontend-dev` | **Complexity:** LOW | **Risk:** LOW

### 1b.5 Settings UI — Provider Selector
- [ ] Extend `src/components/Settings.tsx`:
  - Provider dropdown: `Web Speech API` | `Whisper (Offline WASM)` | `Auto (Best Available)`
  - Whisper sub-options: model size (`tiny` ≈ 45 MB | `base` ≈ 75 MB | `small` ≈ 150 MB)
- [ ] Persist to localStorage
- [ ] Show active provider badge in recording UI

**Agent:** `frontend-dev` | **Complexity:** MEDIUM | **Risk:** LOW

### 1b.6 Tests
- [ ] `src/test/whisper-provider.test.ts` — mocked WASM: load + transcribe + error states
- [ ] `src/test/whisper-model-cache.test.ts` — IndexedDB cache operations
- [ ] `src/test/speech-provider-fallback.test.ts` — Whisper unavailable → falls back to Web Speech API
- [ ] Coverage ≥ 80% for speech module

**Agent:** `frontend-dev` + `ai-integration-dev` | **Complexity:** HIGH | **Risk:** MEDIUM

### Phase 1b Exit Criteria
- [ ] `WhisperProvider` implements `ISpeechProvider`
- [ ] Model downloads on first use with visible progress
- [ ] Model cached in IndexedDB (verify in DevTools → Application → IndexedDB)
- [ ] Recording works end-to-end with Whisper (manual smoke test)
- [ ] Fallback: Whisper WASM unavailable → Web Speech API
- [ ] Settings allow user to switch provider and model size
- [ ] All tests pass; coverage ≥ 80%

---

## Phase 2 — AI Integration (Week 2-3)

### 2.1 Settings UI
- [x] `src/components/Settings.tsx` — API endpoint, API key, active backend indicator
- [x] `src/constants/config.ts` — Default API endpoint, model names
- [x] Config persisted to localStorage (never source code)
- [x] Unit tests: settings load/save, validation

**Agent:** `ai-integration-dev`

### 2.2 Prompt Engineering
- [x] `src/constants/prompts.ts` — 4 prompts: it→en, en→en, en→it, it→it (full + compact variants)
- [x] `buildSystemPrompt` / `buildCompactPrompt` exported from prompts.ts (no separate file needed)
- [x] Unit tests: all 4 language pair combinations produce correct system prompts

**Agent:** `ai-integration-dev`

### 2.3 Gemini Nano Service
- [x] `src/features/ai-integration/gemini-nano.service.ts`
  - `isAvailable(): Promise<boolean>` — feature detect `window.ai`
  - `generate(systemPrompt, text): AsyncGenerator<string>` — streaming
- [x] Unit tests with mocked `window.ai` API (11 tests)
- [x] Error handling: not available, slow model download, session limit

**Agent:** `ai-integration-dev`

### 2.4 External API Service
- [x] `src/features/ai-integration/external-api.service.ts`
  - `isConfigured(): boolean`
  - `generate(systemPrompt, text): AsyncGenerator<string>` — SSE streaming
- [x] Unit tests (5 tests)
- [x] Error handling: network error, 401, 429, invalid JSON

**Agent:** `ai-integration-dev`

### 2.5 AI Manager (Orchestrator)
- [x] `src/features/ai-integration/ai-manager.service.ts`
  - Tries Gemini Nano first, falls back to external API
  - Throws `AINotConfiguredError` if both unavailable
- [x] `src/features/ai-integration/AIProvider.tsx` — Active backend indicator
- [x] `src/hooks/useAISession.ts` — Session lifecycle (abort support)
- [x] Integration tests: fallback chain, error states, streaming updates (6 tests)

**Agent:** `ai-integration-dev`

### Phase 2 Exit Criteria
- [x] Gemini Nano detected and used when available
- [x] Falls back to external API (LM Studio default) when unavailable
- [x] Prompts are language-pair specific
- [x] Streaming responses display incrementally
- [x] Settings UI works and persists
- [x] All tests pass (98 tests), coverage ≥ 80%

---

## Phase 3 — Documentation Generation (Week 3-4)

### 3.1 Output Formatters
- [x] `src/features/documentation-generation/formatters/markdown.formatter.ts` — pass-through + cleanup
- [x] `src/features/documentation-generation/formatters/wiki.formatter.ts` — Confluence markup
- [x] `src/features/documentation-generation/formatters/html.formatter.ts` — HTML preview
- [x] Unit tests: edge cases (empty, special chars, code blocks, nested lists)

**Agent:** `frontend-dev`

### 3.2 Documentation Generator Service
- [x] `src/features/documentation-generation/doc-generator.service.ts`
  - Takes transcription + language pair → calls AI → streams output
- [x] `src/hooks/useDocumentationStore.ts` — Zustand doc store

**Agent:** `frontend-dev` + `ai-integration-dev`

### 3.3 Documentation Editor UI
- [x] `src/features/documentation-generation/DocumentationEditor.tsx`
  - Format tabs (Markdown / Wiki / HTML)
  - Editable textarea
  - Live HTML preview panel
  - Copy to clipboard button
  - "Regenerate" button
- [x] Export: `src/features/export/ExportPanel.tsx` + `export.service.ts`
- [x] Integration test: transcription → AI → formatted doc → clipboard

**Agent:** `frontend-dev`

### Phase 3 Exit Criteria
- [x] All 3 formats produce correct output
- [x] Confluence wiki markup is valid and paste-ready
- [x] Copy to clipboard works
- [x] User can edit before copying
- [x] All tests pass (121 tests), coverage ≥ 80%

---

## Phase 4 — Learning & Suggestions (Week 4-5)

### 4.1 Database Setup
- [ ] `src/features/learning/storage.service.ts` — Dexie.js DB definition
- [ ] DB schema: `sessions` table, `feedback` table
- [ ] `src/utils/db.ts` — Singleton DB instance
- [ ] Unit tests: CRUD operations, schema validation

**Agent:** `learning-engine-dev`

### 4.2 Session Persistence
- [ ] Auto-save session to IndexedDB after each completed documentation
- [ ] Include: language pair, format used, transcription length, AI backend, timestamp
- [ ] Unit tests: save + retrieve

**Agent:** `learning-engine-dev`

### 4.3 Learning Engine
- [ ] `src/features/learning/learning-engine.service.ts`
  - Analyze sessions: most used format, most used language pair
  - Detect patterns: preferred documentation structure
- [ ] `src/features/learning/suggestions-engine.service.ts`
  - Generate 3 suggestions in output language after 5+ sessions
  - Simple heuristics-based (no additional AI call needed)
- [ ] Unit tests: pattern detection, suggestion generation

**Agent:** `learning-engine-dev`

### 4.4 Suggestions UI
- [ ] `src/features/learning/LearningPanel.tsx` — Shows suggestions, feedback buttons
- [ ] Feedback stored in DB (helpful / not helpful)
- [ ] Integration test: complete 5 sessions → suggestions appear → feedback stored

**Agent:** `learning-engine-dev`

### 4.5 Data Management
- [ ] Export learning data as JSON
- [ ] Clear all data option
- [ ] Data cleanup for records older than 90 days

**Agent:** `learning-engine-dev`

### Phase 4 Exit Criteria
- [ ] Sessions stored automatically
- [ ] Suggestions appear after 5 sessions
- [ ] Suggestions are in the output language
- [ ] User can export/clear data
- [ ] All tests pass, coverage ≥ 80%

---

## Phase 5 — Polish & Deploy (Week 5-6)

### 5.1 Layout & Navigation
- [ ] `src/components/Layout.tsx` — Main layout with header, main, sidebar
- [ ] `src/components/Navigation.tsx` — Top nav with settings button
- [ ] `src/components/HelpPanel.tsx` — Quick guide, language support status

**Agent:** `frontend-dev`

### 5.2 Settings Refinements
- [ ] AI backend status indicator (Gemini Nano available / External API configured / None)
- [ ] Language support status (accuracy indicators per language)
- [ ] Keyboard shortcuts (Space = start/stop, Ctrl+C = copy, Ctrl+S = save)

**Agent:** `ai-integration-dev`

### 5.3 Visual Polish
- [ ] Dark mode support (Tailwind dark: classes)
- [ ] Loading states and skeleton screens
- [ ] Error state UI (friendly messages, no raw error dumps)
- [ ] Responsive layout (tablet-friendly, mobile read-only)

**Agent:** `frontend-dev`

### 5.4 E2E Tests
- [ ] `record-and-export.e2e.ts` — Full happy path (Italian → English → copy)
- [ ] `fallback-api.e2e.ts` — No Gemini Nano → external API
- [ ] `language-switch.e2e.ts` — Session 1 Italian, Session 2 English

**Agent:** `frontend-dev`

### 5.5 Accessibility & Performance
- [ ] Keyboard navigation throughout (Tab, Enter, Escape)
- [ ] ARIA labels on all interactive elements
- [ ] axe-core accessibility audit
- [ ] Lighthouse audit (target: 90+)

**Agent:** `frontend-dev`

### 5.6 Deploy
- [ ] `npm run build` passes with 0 errors
- [ ] Deploy to Vercel or Netlify
- [ ] README.md with setup instructions

**Agent:** All

### Phase 5 Exit Criteria
- [ ] E2E tests pass for all 3 critical flows
- [ ] Lighthouse score ≥ 90
- [ ] 0 accessibility violations (axe-core)
- [ ] App deployed and publicly accessible
- [ ] Overall test coverage ≥ 80%

---

## Current Status

| Phase | Status | Notes |
|---|---|---|
| Phase 1 | ✅ Complete | 49 tests passing, build clean, two-tier prompts (full + compact) |
| Phase 1a | ✅ Complete | ISpeechProvider, WebSpeechProvider, SpeechProviderManager, language-utils — 87 tests passing |
| Phase 1b | 🔲 Not started | Whisper WASM — requires Phase 1a, post-MVP optional |
| Phase 2 | ✅ Complete | AIProvider, useAISession, gemini-nano tests — 98 tests passing |
| Phase 3 | ✅ Complete | Formatters, DocumentationEditor, ExportPanel, doc-generator tests — 121 tests passing |
| Phase 4 | 🔲 Not started | |
| Phase 5 | 🔲 Not started | |

---

## Agent Assignments Summary

| Agent | Phases | Primary Responsibility |
|---|---|---|
| `frontend-dev` | 1, 1a, 1b, 3, 5 | Language selection, voice recording, speech providers, formatters, UI |
| `ai-integration-dev` | 1b, 2, 5 | Gemini Nano, external API, Whisper WASM, prompt engineering |
| `learning-engine-dev` | 1b, 4 | IndexedDB, Dexie.js, Whisper model cache, pattern analysis |
