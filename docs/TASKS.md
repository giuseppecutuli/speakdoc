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
- [x] Evaluate `@xenova/transformers` v3+: bundle size, language support, model formats, maintenance
- [x] Prototype: load `Xenova/whisper-tiny` model, transcribe a short audio Blob
- [x] Benchmark accuracy vs Web Speech API on Italian and English samples
- [x] Document chosen API surface

**Agent:** `ai-integration-dev` | **Complexity:** MEDIUM | **Risk:** MEDIUM

### 1b.2 WhisperProvider Implementation
- [x] `src/features/voice-input/providers/WhisperProvider.ts` — implements `ISpeechProvider`
- [x] `isAvailable()` → `typeof WebAssembly !== 'undefined'`
- [x] `isConfigured()` → lazy-loads WASM pipeline with progress callback
- [x] `start()` → uses `MediaRecorder` to capture audio Blob, then transcribes
- [x] Emits `TranscriptionResult` (final only — no interim results from Whisper)
- [x] Error handling: network failure, model download timeout, WASM crash
- [x] Unit tests: availability detection, model loading (mocked WASM), error states (14 tests)

**Agent:** `ai-integration-dev` | **Complexity:** HIGH | **Risk:** HIGH

### 1b.3 Whisper Model Cache (IndexedDB)
- [x] `src/features/voice-input/whisper-model-cache.ts` — cache WASM model binary in IndexedDB
- [x] On first use: download → show progress → store in Dexie
- [x] Subsequent uses: load from cache (no network request)
- [x] Storage quota check; graceful degradation if quota exceeded
- [x] Unit tests: save/load, quota handling (10 tests)

**Agent:** `learning-engine-dev` | **Complexity:** MEDIUM | **Risk:** MEDIUM

### 1b.4 WhisperService Wrapper
- [x] `src/features/voice-input/whisper.service.ts` — wraps @xenova/transformers pipeline
- [x] Methods: load(modelId, onProgress), transcribe(audioBlob), unload(), isLoaded(), getLoadedModelSize()
- [x] Lifecycle management: lazy load, single instance, proper cleanup
- [x] Unit tests: initialization, transcription, error states (16 tests)

**Agent:** `ai-integration-dev` | **Complexity:** MEDIUM | **Risk:** MEDIUM

### 1b.5 Settings UI — Provider Selector
- [x] Extend `src/components/Settings.tsx`:
  - Provider dropdown: `Web Speech API` | `Whisper (Offline WASM)` | `Auto (Best Available)`
  - Whisper sub-options: model size (`tiny` ≈ 45 MB | `base` ≈ 75 MB | `small` ≈ 150 MB)
- [x] Persist to localStorage via STORAGE_KEYS
- [x] Show active provider badge in recording UI
- [x] Model download progress UI integrated into settings

**Agent:** `frontend-dev` | **Complexity:** MEDIUM | **Risk:** LOW

### 1b.6 Constants & Configuration
- [x] `src/constants/whisper-config.ts` — WhisperModelSize type, WHISPER_MODELS record, DEFAULT_WHISPER_MODEL_SIZE, WHISPER_LOAD_TIMEOUT_MS
- [x] `src/constants/config.ts` — add SPEECH_PROVIDER and WHISPER_MODEL_SIZE to STORAGE_KEYS
- [x] `src/utils/db.ts` — WhisperModelRecord type, whisperModels table in Dexie version 2

**Agent:** `frontend-dev` | **Complexity:** LOW | **Risk:** LOW

### 1b.7 SpeechProviderManager Integration
- [x] Update `src/features/voice-input/SpeechProviderManager.ts` to include WhisperProvider in default array
- [x] Fallback chain: Whisper unavailable → Web Speech API
- [x] All Phase 1a tests remain passing

**Agent:** `frontend-dev` | **Complexity:** LOW | **Risk:** MEDIUM

### 1b.8 Tests
- [x] `src/test/whisper-provider.test.ts` — mocked WASM: load + transcribe + error states (14 tests)
- [x] `src/test/whisper-model-cache.test.ts` — IndexedDB cache operations (10 tests)
- [x] `src/test/whisper-service.test.ts` — WhisperService lifecycle, transcription, cleanup (16 tests)
- [x] All new tests pass; speech module coverage ≥ 80%

**Agent:** `frontend-dev` + `ai-integration-dev` | **Complexity:** HIGH | **Risk:** MEDIUM

### 1b.9 Bug Fixes
- [x] **Bug Fix 1 — Model cache persistence** (`src/components/Settings.tsx`, `src/features/voice-input/whisper.service.ts`):
  - Problem: After page refresh, `WhisperService.isLoaded()` always returned `false` (in-memory state only), causing UI to show "Download" button again
  - Solution: Added localStorage helpers (`whisperLoadedKey`, `isWhisperModelCached`, `markWhisperModelCached`) that persist marker key `speak-doc:whisper-loaded:{modelId}`; `WhisperModelSection` initial `loadState` now derives from this marker; `markWhisperModelCached` called after successful download
- [x] **Bug Fix 2 — Progress bar NaN and backward jumps** (`src/features/voice-input/whisper.service.ts`, `src/components/Settings.tsx`):
  - Problem: `@xenova/transformers` fires multiple event types (`initiate`, `download`, `progress`, `done`, `ready`), only `progress` events have numeric `progress` field (others `undefined` → `NaN`); multiple model file downloads sequentially each reset to 0% causing backward jumps
  - Solution Service Layer: Guard onProgress callback — only call when `event.status === 'progress'` AND `typeof event.progress === 'number'` AND `!isNaN(event.progress)`
  - Solution UI Layer: Progress state update uses `Math.max(prev, Math.round(pct))` to ensure progress only ever increases

### Phase 1b Exit Criteria
- [x] `WhisperProvider` implements `ISpeechProvider`
- [x] Model downloads on first use with visible progress
- [x] Model cached in IndexedDB (via WhisperModelCache) + localStorage persistence
- [x] Recording works end-to-end with Whisper
- [x] Fallback: Whisper WASM unavailable → Web Speech API
- [x] Settings allow user to switch provider and model size
- [x] All tests pass: 161 total tests, coverage ≥ 80%
- [x] No regressions: Phase 1, 1a, 2, 3 tests still passing
- [x] Page refresh preserves model cache state and shows correct download status
- [x] Progress bar displays correctly without NaN or backward jumps

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

### 3.4 Audio Playback
- [x] Add `<audio>` element to `src/features/voice-input/VoiceRecorder.tsx` shown when `audioBlob` is available after recording stops
- [x] Controls only visible in `done` status (not during recording)
- [x] Unit tests: `src/utils/audio-url.ts` — createAudioUrl/revokeAudioUrl (2 tests); component tests skipped per MVP policy

**Agent:** `frontend-dev` | **Complexity:** LOW | **Risk:** LOW

### Phase 3 Exit Criteria
- [x] All 3 formats produce correct output
- [x] Confluence wiki markup is valid and paste-ready
- [x] Copy to clipboard works
- [x] User can edit before copying
- [x] All tests pass (121 tests), coverage ≥ 80%
- [x] Audio playback available after recording stops

---

## Phase 4 — Learning & Suggestions (Week 4-5)

### 4.1 Database Setup
- [x] `src/features/learning/storage.service.ts` — Dexie.js DB definition
- [x] DB schema: `sessions` table, `feedback` table
- [x] `src/utils/db.ts` — Singleton DB instance
- [x] Unit tests: CRUD operations, schema validation

**Agent:** `learning-engine-dev`

### 4.2 Session Persistence
- [x] Auto-save session to IndexedDB after each completed documentation
- [x] Include: language pair, format used, transcription length, AI backend, timestamp
- [x] Unit tests: save + retrieve

**Agent:** `learning-engine-dev`

### 4.3 Learning Engine
- [x] `src/features/learning/learning-engine.service.ts`
  - Analyze sessions: most used format, most used language pair
  - Detect patterns: preferred documentation structure
- [x] `src/features/learning/suggestions-engine.service.ts`
  - Generate 3 suggestions in output language after 5+ sessions
  - Simple heuristics-based (no additional AI call needed)
- [x] Unit tests: pattern detection, suggestion generation

**Agent:** `learning-engine-dev`

### 4.4 Suggestions UI
- [x] `src/features/learning/LearningPanel.tsx` — Shows suggestions, feedback buttons
- [x] Feedback stored in DB (helpful / not helpful)
- [x] Integration test: complete 5 sessions → suggestions appear → feedback stored

**Agent:** `learning-engine-dev`

### 4.5 Data Management
- [x] Export learning data as JSON
- [x] Clear all data option
- [x] Data cleanup for records older than 90 days

**Agent:** `learning-engine-dev`

### 4.6 Audio Export
- [x] `src/features/export/audio-export.service.ts` — `downloadAudioBlob(blob: Blob, filename: string): void` using `URL.createObjectURL` + programmatic `<a>` click
- [x] Add "Download Recording" button to `src/features/export/ExportPanel.tsx` (visible only when `audioBlob` is non-null)
- [x] Filename format: `recording-{YYYY-MM-DD-HHmm}.webm`
- [x] Unit tests: URL creation, filename generation, null guard

**Agent:** `frontend-dev` | **Complexity:** LOW | **Risk:** LOW

### 4.7 Audio File Import (Whisper only)
- [x] `src/features/voice-input/AudioFileImporter.tsx` — file input (`accept="audio/*"`, max 50 MB)
- [x] Validate file size; show user-friendly error if > 50 MB
- [x] Guard: only enabled when active speech provider is Whisper; show tooltip "Switch to Whisper provider in Settings to use this feature" otherwise
- [x] On file select: pass `File` blob to `WhisperProvider` transcription flow (same path as live recording)
- [x] Unit tests: file size validation, provider guard, transcription trigger

**Agent:** `frontend-dev` + `ai-integration-dev` | **Complexity:** MEDIUM | **Risk:** MEDIUM

### 4.8 Documentation Templates
- [x] `src/constants/doc-templates.ts` — 5 templates: `generic`, `meeting-notes`, `tech-spec`, `adr`, `bug-report`; each has `id`, `label`, `promptModifier` (string appended to base system prompt)
- [x] `src/features/documentation-generation/TemplateSelector.tsx` — dropdown UI, defaults to `generic`
- [x] Update `buildSystemPrompt` and `buildCompactPrompt` in `src/constants/prompts.ts` to accept optional `templateId` param; append `promptModifier` when non-generic
- [x] Persist selected template to localStorage via `STORAGE_KEYS.DOC_TEMPLATE`
- [x] Add `DOC_TEMPLATE` key to `src/constants/config.ts` STORAGE_KEYS
- [x] Unit tests: prompt composition per template (all 5 × 4 language pairs = 20 cases), localStorage persistence

**Agent:** `frontend-dev` + `ai-integration-dev` | **Complexity:** MEDIUM | **Risk:** LOW

### 4.9 Session History Browser
- [x] `src/features/learning/SessionHistory.tsx` — list of past sessions with: date, language pair, template used, AI backend, truncated transcription preview
- [x] Actions per session: view full doc, copy to clipboard, re-export in different format
- [x] Integrate with `sessionRepository.getRecent(50)` from Phase 4.2
- [x] Unit tests: session list rendering, action callbacks

**Agent:** `learning-engine-dev` | **Complexity:** MEDIUM | **Risk:** LOW

### Phase 4 Exit Criteria
- [x] Sessions stored automatically
- [x] Suggestions appear after 5 sessions
- [x] Suggestions are in the output language
- [x] User can export/clear data
- [x] Audio playback available after recording, download button in ExportPanel
- [x] Audio file import works end-to-end with Whisper; graceful error for Web Speech users
- [x] All 5 documentation templates produce distinct AI prompts
- [x] Session history browser shows past sessions with re-export capability
- [x] All tests pass, coverage ≥ 80%

---

## Phase 4.10 — Revision History (Undo/Redo)

_Prerequisite for Phase 4.11–4.13. No new files — extends existing store and editor._

### 4.10.1 Extend `useDocumentationStore`
- [x] Add `history: string[]`, `historyIndex: number` to state (initial: `[]`, `-1`)
- [x] Add `pushHistory(content: string): void` — prepend snapshot; cap at 20; reset redo tail
- [x] Add `undo(): void` — decrement `historyIndex`, restore content
- [x] Add `redo(): void` — increment `historyIndex`, restore content
- [x] Add derived `canUndo: boolean`, `canRedo: boolean`
- [x] Reset history on existing `reset()` action
- [x] Unit tests: pushHistory cap, undo/redo navigation, edge cases (empty, at bounds) — 8 tests

**Agent:** `frontend-dev` | **Complexity:** LOW | **Risk:** LOW

### 4.10.2 Undo/Redo UI in `DocumentationEditor`
- [x] Add `Undo` / `Redo` icon buttons to the editor toolbar header
- [x] Buttons disabled when `!canUndo` / `!canRedo`
- [x] Clicking Undo/Redo updates `editedContent` local state from store

**Agent:** `frontend-dev` | **Complexity:** LOW | **Risk:** LOW

### Phase 4.10 Exit Criteria
- [x] `pushHistory` snapshots content before AI edits
- [x] `undo()` / `redo()` navigate history correctly
- [x] History resets on document reset
- [x] Undo/Redo buttons appear and are correctly enabled/disabled
- [x] All tests pass; coverage ≥ 80%

---

## Phase 4.11 — Improvement Prompts

### 4.11.1 `src/constants/improvement-prompts.ts`
- [x] `buildSelectionImprovementPrompt(instruction, selectedText, outputLanguage)` → `{ system, user }`
- [x] `buildDocumentImprovementPrompt(instruction, fullContent, outputLanguage)` → `{ system, user }`
- [x] System prompt for selection: "Rewrite ONLY the provided excerpt per the instruction. Return ONLY the rewritten text."
- [x] System prompt for document: "Improve the entire document per the instruction. Return ONLY the improved document."
- [x] Unit tests: 2 scopes × 2 languages = 4 test cases + instruction injection checks — 8 tests

**Agent:** `ai-integration-dev` | **Complexity:** LOW | **Risk:** LOW

### Phase 4.11 Exit Criteria
- [x] Both prompt builders produce correct system/user message pairs
- [x] Output language is correctly embedded in prompts
- [x] Instruction is safely interpolated (no injection risk)

---

## Phase 4.12 — Inline Improvement Service

### 4.12.1 `src/features/documentation-generation/inline-improvement.service.ts`
- [x] `improveSelection(selectedText, instruction, outputLanguage): AsyncGenerator<string>` — calls AI manager with selection prompt
- [x] `improveDocument(fullContent, instruction, outputLanguage): AsyncGenerator<string>` — calls AI manager with document prompt
- [x] Reuses existing `AIManager` (Gemini Nano → external API fallback)
- [x] Throws `AINotConfiguredError` if no backend available
- [x] Unit tests: mocked AI manager, selection replacement, full doc replacement, error propagation — 6 tests

**Agent:** `ai-integration-dev` | **Complexity:** LOW | **Risk:** LOW

### Phase 4.12 Exit Criteria
- [x] Both generators stream correctly through AI manager
- [x] Error propagation works (AINotConfiguredError bubbles up)
- [x] Tests pass with mocked AI manager

---

## Phase 4.13 — AI Inline Editing UI

### 4.13.1 `SelectionImprovementPopover.tsx`
- [x] Detects textarea selection via `onSelect` → reads `selectionStart` / `selectionEnd`
- [x] Hides when selection is empty or length < 3 chars
- [x] Positions popover using `getBoundingClientRect()` on the textarea; `position: fixed`
- [x] Dismissed on `Escape`, click-outside, or scroll
- [x] Contains: instruction `<input>` (max 500 chars) + "Improve" submit button + loading spinner
- [x] On submit: calls `pushHistory()` → streams `improveSelection()` → replaces `[start, end]` in content
- [x] Unit tests: show/hide on selection, instruction validation, replacement logic — 5 tests

**Agent:** `frontend-dev` | **Complexity:** MEDIUM | **Risk:** MEDIUM

### 4.13.2 `DocumentImprovementModal.tsx`
- [x] Radix Dialog modal (consistent with Settings)
- [x] Instruction textarea (max 500 chars, shows char count)
- [x] Submit → `pushHistory()` → streams `improveDocument()` → replaces full editor content
- [x] Shows streaming progress (spinner + partial text update in editor)
- [x] Disabled when `isGenerating` is true
- [x] Unit tests: open/close, instruction validation, submit flow — 3 tests

**Agent:** `frontend-dev` | **Complexity:** LOW | **Risk:** LOW

### 4.13.3 Wire into `DocumentationEditor.tsx`
- [x] Add `SelectionImprovementPopover` rendered outside textarea (portal or sibling)
- [x] Add "Improve Doc" button to toolbar → opens `DocumentImprovementModal`
- [x] HTML tab: disable inline editing UI, show tooltip "Switch to Markdown or Wiki tab to use AI editing"
- [x] All AI editing blocked while `isGenerating` is true

**Agent:** `frontend-dev` | **Complexity:** LOW | **Risk:** LOW

### Phase 4.13 Exit Criteria
- [x] Selecting text in Markdown/Wiki tab shows popover
- [x] Entering instruction + submitting replaces only selected text
- [x] "Improve Doc" button opens modal, full doc is replaced on submit
- [x] HTML tab shows disabled state with tooltip
- [x] Undo button enabled after each AI edit
- [x] All tests pass; total coverage ≥ 80%

---

## Phase 4.14 — Pre-Phase 5 Refactoring

_Refactor `Settings.tsx` (455 lines, exceeds 400-line guideline) by extracting its sub-components into focused files. Other components are within bounds: `VoiceRecorder.tsx` (250 lines), `SessionHistory.tsx` (131 lines), `DocumentationEditor.tsx` will grow slightly with Phase 4.13 additions but remain manageable._

**Why now:** Clean separation of concerns before Phase 5 adds more UI files. Smaller files are easier to maintain and test.

### 4.14.1 Extract `BackendBadge`
- [x] Move `BackendBadge` component to `src/features/ai-integration/BackendBadge.tsx`
- [x] Export and import in `Settings.tsx`
- [x] No logic change, only file split

**Agent:** `frontend-dev` | **Complexity:** LOW | **Risk:** LOW

### 4.14.2 Extract `GeminiNanoGuide`
- [x] Move `GeminiNanoGuide` + `FLAG_STEPS` constant to `src/features/ai-integration/GeminiNanoGuide.tsx`
- [x] Export and import in `Settings.tsx`

**Agent:** `frontend-dev` | **Complexity:** LOW | **Risk:** LOW

### 4.14.3 Extract `WhisperModelSection`
- [x] Move `WhisperModelSection` + its local helpers (`whisperLoadedKey`, `isWhisperModelCached`, `markWhisperModelCached`, `loadWhisperModelSize`, `saveWhisperModelSize`) to `src/features/voice-input/WhisperModelSection.tsx`
- [x] Export and import in `Settings.tsx`

**Agent:** `frontend-dev` | **Complexity:** LOW | **Risk:** LOW

### 4.14.4 Verify `Settings.tsx` reduced to ≤ 200 lines
- [x] After extractions, `Settings.tsx` should contain only `SettingsPanel` orchestration logic
- [x] Run full test suite — all 186+ tests must still pass (regression check)
- [x] `tsc --noEmit` must pass with 0 errors

**Agent:** `frontend-dev` | **Complexity:** LOW | **Risk:** LOW

### Phase 4.14 Exit Criteria
- [x] `Settings.tsx` ≤ 200 lines
- [x] `BackendBadge.tsx`, `GeminiNanoGuide.tsx`, `WhisperModelSection.tsx` each ≤ 120 lines
- [x] 0 regressions — all existing tests pass
- [x] 0 TypeScript errors

---

## Phase 4.15 — Long-Session Recording Support

_Enables recording calls of 40+ minutes without accuracy degradation or WASM out-of-memory._

### 4.15.1 Chunked Whisper recording

- [x] Add `WHISPER_CHUNK_INTERVAL_MS = 30_000` to `src/constants/whisper-config.ts`
- [x] Refactor `WhisperProvider.ts`:
  - `createRecorder(stream)` private method — creates, wires, and starts each `MediaRecorder`
  - `setInterval` in `start()` calls `rotateRecorder()` every 30 s — stops old recorder, creates a new one on the same stream; each resulting WebM file is independently decodable
  - Serial `transcriptionQueue: Promise<void>` — chains all `onstop` transcriptions so WASM calls never overlap
  - `pendingTranscriptions` counter + `isStopped` flag — `endCallback` fires only after the last chunk's transcription completes via `checkAllDone()`
  - `clearTimer()` helper called by both `stop()` and `abort()`

### 4.15.2 Recording duration timer

- [x] Add `elapsed: number` state to `VoiceRecorder.tsx`
- [x] `useEffect` increments counter every 1 s while `isRecording`
- [x] Reset on `handleStart`; display as `MM:SS` next to the recording indicator

### 4.15.3 Tests

- [x] Update `whisper-provider.test.ts` — fix existing `onEnd` tests (call `provider.stop()` before `onstop`), add:
  - "does not fire endCallback if stop has not been called" (rotation case)
  - "does not fire endCallback after abort"
  - Interval rotation creates second MediaRecorder (fake timers)
  - `clearInterval` called on `stop()` and `abort()`
  - Chunks transcribed serially (fake timers + blocked first transcription)

### Phase 4.15 Exit Criteria

- [x] 229 tests passing (20 in whisper-provider suite, 6 new tests added vs Phase 4.14)
- [x] 0 TypeScript errors
- [x] `VoiceRecorder` shows live `MM:SS` timer during recording

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
| Phase 1b | ✅ Complete | WhisperProvider, WhisperService, WhisperModelCache, Settings UI — 40 new tests added, 161 total tests passing |
| Phase 2 | ✅ Complete | AIProvider, useAISession, gemini-nano tests — 98 tests passing |
| Phase 3 | ✅ Complete | Formatters, DocumentationEditor, ExportPanel, audio playback — 163 tests passing |
| Phase 4 | ✅ Complete | LearningPanel, SessionHistory, AudioFileImporter, TemplateSelector, audio-export, data-management — 186 tests passing |
| Phase 4.10 | ✅ Complete | Revision history (undo/redo) in useDocumentationStore + editor toolbar — 11 new tests |
| Phase 4.11 | ✅ Complete | Improvement prompts (selection + document scope) — 9 new tests |
| Phase 4.12 | ✅ Complete | inline-improvement.service.ts — 6 new tests |
| Phase 4.13 | ✅ Complete | SelectionImprovementPopover + DocumentImprovementModal + editor wiring — 11 new tests |
| Phase 4.14 | ✅ Complete | Refactor Settings.tsx → BackendBadge, GeminiNanoGuide, WhisperModelSection — 223 tests passing |
| Phase 4.15 | ✅ Complete | Long-session support: WhisperProvider 30 s chunk rotation + serial queue + MM:SS timer — 229 tests passing |
| Phase 5 | 🔲 Not started | Layout, polish, E2E tests, accessibility |

---

## Agent Assignments Summary

| Agent | Phases | Primary Responsibility |
|---|---|---|
| `frontend-dev` | 1, 1a, 1b, 3, 4, 5 | Language selection, voice recording, speech providers, formatters, audio playback/export/import, template selector, UI |
| `ai-integration-dev` | 1b, 2, 4, 5 | Gemini Nano, external API, Whisper WASM, prompt engineering, template prompt modifiers |
| `learning-engine-dev` | 1b, 4 | IndexedDB, Dexie.js, Whisper model cache, pattern analysis, session history |
