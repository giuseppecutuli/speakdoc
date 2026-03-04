# Task Breakdown
## Doc Assistant — Phase-by-Phase Implementation

**Convention:** Each task includes the responsible agent from `.claude/agents/`.

> **MVP Testing Policy:** Unit tests only for AI layer and formatters. Skip E2E and component tests. Test UI manually in Chrome.

---

## Phase 1 — Foundation + Language Selection + Voice Input (Week 1-2)

### 1.1 Project Setup
- [x] Initialize Vite + React 18 + TypeScript project (`doc-assistant/`)
- [x] Configure Tailwind CSS + shadcn/ui
- [x] Set up Vitest + React Testing Library + Playwright
- [x] Configure ESLint + Prettier
- [x] Create `src/` folder structure (features, components, hooks, types, constants, utils)
- [x] Create `public/data/languages.json` and `public/data/speech-codes.json`

**Agent:** `tdd-enforcer` (scaffold tests first, then setup)

### 1.2 Type Definitions
- [x] `src/types/language.ts` — `LanguageCode`, `LanguageConfig`, `LanguageSession`
- [x] `src/types/voice.ts` — `RecordingStatus`, `TranscriptionResult`
- [x] `src/types/session.ts` — `DocumentationSession`, `SessionFeedback`
- [x] `src/types/ai.ts` — `AIBackend`, `AIConfig`, `GenerationOptions`
- [x] `src/types/documentation.ts` — `OutputFormat`, `DocumentationOutput`

**Agent:** `tdd-enforcer`

### 1.3 Constants + Language Config
- [x] `src/constants/languages.ts` — Supported languages map (en, it)
- [x] `src/constants/speech-recognition-codes.ts` — BCP 47 codes per language
- [x] `src/utils/bcp47.utils.ts` — Language code normalization
- [x] `src/utils/language-utils.ts` — Language support detection
- [x] `src/utils/feature-detection.ts` — Detect Web Speech API availability

**Agent:** `voice-ui-dev`

### 1.4 Language Selection Feature
- [x] `src/features/language-selection/LanguageSelectionModal.tsx` — Modal UI with dropdowns
- [x] `src/features/language-selection/LanguageProvider.tsx` — Context/store connection
- [x] `src/features/language-selection/language.service.ts` — Load/save language preferences
- [x] `src/hooks/useLanguage.ts` — Zustand store (speakingLang, outputLang, locked)
- [x] Unit tests for all above (RED → GREEN)
- [x] Language persists to localStorage
- [x] Lock mechanism tested (cannot change during recording)

**Agent:** `voice-ui-dev` + `tdd-enforcer`

### 1.5 Voice Input Feature
- [x] `src/features/voice-input/recorder.service.ts` — MediaRecorder wrapper
- [x] `src/features/voice-input/speech-recognition.service.ts` — Web Speech API wrapper, language-aware
- [x] `src/features/voice-input/VoiceRecorder.tsx` — Record button, status, waveform
- [x] `src/features/voice-input/waveform-visualizer.ts` — Web Audio API canvas viz
- [x] `src/hooks/useVoiceRecorder.ts` — Zustand recording store
- [x] Unit tests: recording states, speech API language codes, error handling
- [x] Integration test: language selection → recording starts with correct language code

**Agent:** `voice-ui-dev` + `tdd-enforcer`

### 1.6 Transcription Display
- [x] `src/features/transcription/TranscriptionDisplay.tsx` — Real-time text panel
- [x] `src/features/transcription/transcriber.service.ts` — Buffer interim + final results
- [x] Unit tests: transcript buffering, language label display

**Agent:** `voice-ui-dev`

### Phase 1 Exit Criteria
- [x] Language modal appears before recording
- [x] Can select Italian → English
- [x] Languages locked during recording
- [x] Voice recording works with waveform
- [x] Live transcription updates in real-time
- [x] All tests pass, coverage ≥ 80%

---

## Phase 2 — AI Integration (Week 2-3)

### 2.1 Settings UI
- [ ] `src/components/Settings.tsx` — API endpoint, API key, active backend indicator
- [ ] `src/constants/config.ts` — Default API endpoint, model names
- [ ] Config persisted to localStorage (never source code)
- [ ] Unit tests: settings load/save, validation

**Agent:** `ai-integration-dev`

### 2.2 Prompt Engineering
- [ ] `src/constants/prompts.ts` — 4 prompts: it→en, en→en, en→it, it→it
- [ ] `src/features/ai-integration/prompt-builder.service.ts` — Build prompt per language pair
- [ ] Unit tests: all 4 language pair combinations produce correct system prompts

**Agent:** `ai-integration-dev`

### 2.3 Gemini Nano Service
- [ ] `src/features/ai-integration/gemini-nano.service.ts`
  - `isAvailable(): Promise<boolean>` — feature detect `window.ai`
  - `generate(systemPrompt, text): AsyncGenerator<string>` — streaming
- [ ] Unit tests with mocked `window.ai` API
- [ ] Error handling: not available, slow model download, session limit

**Agent:** `ai-integration-dev` + `tdd-enforcer`

### 2.4 External API Service
- [ ] `src/features/ai-integration/external-api.service.ts`
  - `isConfigured(): boolean`
  - `generate(systemPrompt, text): AsyncGenerator<string>` — SSE streaming
- [ ] Unit tests with MSW mock server
- [ ] Error handling: network error, 401, 429, invalid JSON

**Agent:** `ai-integration-dev` + `tdd-enforcer`

### 2.5 AI Manager (Orchestrator)
- [ ] `src/features/ai-integration/ai-manager.service.ts`
  - Tries Gemini Nano first, falls back to external API
  - Throws `AINotConfiguredError` if both unavailable
- [ ] `src/features/ai-integration/AIProvider.tsx` — Active backend indicator
- [ ] `src/hooks/useAISession.ts` — Session lifecycle
- [ ] Integration tests: fallback chain, error states, streaming updates

**Agent:** `ai-integration-dev` + `tdd-enforcer`

### Phase 2 Exit Criteria
- [ ] Gemini Nano detected and used when available
- [ ] Falls back to external API (LM Studio default) when unavailable
- [ ] Prompts are language-pair specific
- [ ] Streaming responses display incrementally
- [ ] Settings UI works and persists
- [ ] All tests pass, coverage ≥ 80%

---

## Phase 3 — Documentation Generation (Week 3-4)

### 3.1 Output Formatters
- [ ] `src/features/documentation-generation/formatters/markdown.formatter.ts` — pass-through + cleanup
- [ ] `src/features/documentation-generation/formatters/wiki.formatter.ts` — Confluence markup
- [ ] `src/features/documentation-generation/formatters/html.formatter.ts` — HTML preview
- [ ] Unit tests: edge cases (empty, special chars, code blocks, nested lists)

**Agent:** `doc-formatter-dev` + `tdd-enforcer`

### 3.2 Documentation Generator Service
- [ ] `src/features/documentation-generation/doc-generator.service.ts`
  - Takes transcription + language pair → calls AI → streams output
- [ ] `src/hooks/useDocumentation.ts` — Zustand doc store

**Agent:** `doc-formatter-dev` + `ai-integration-dev`

### 3.3 Documentation Editor UI
- [ ] `src/features/documentation-generation/DocumentationEditor.tsx`
  - Format tabs (Markdown / Wiki / HTML)
  - Editable textarea
  - Live HTML preview panel
  - Copy to clipboard button
  - "Regenerate" button
- [ ] Export: `src/features/export/ExportPanel.tsx` + `export.service.ts`
- [ ] Integration test: transcription → AI → formatted doc → clipboard

**Agent:** `doc-formatter-dev` + `tdd-enforcer`

### Phase 3 Exit Criteria
- [ ] All 3 formats produce correct output
- [ ] Confluence wiki markup is valid and paste-ready
- [ ] Copy to clipboard works
- [ ] User can edit before copying
- [ ] All tests pass, coverage ≥ 80%

---

## Phase 4 — Learning & Suggestions (Week 4-5)

### 4.1 Database Setup
- [ ] `src/features/learning/storage.service.ts` — Dexie.js DB definition
- [ ] DB schema: `sessions` table, `feedback` table
- [ ] `src/utils/db.ts` — Singleton DB instance
- [ ] Unit tests: CRUD operations, schema validation

**Agent:** `learning-engine-dev` + `tdd-enforcer`

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

**Agent:** `learning-engine-dev` + `tdd-enforcer`

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

**Agent:** `doc-formatter-dev`

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

**Agent:** `doc-formatter-dev`

### 5.4 E2E Tests
- [ ] `record-and-export.e2e.ts` — Full happy path (Italian → English → copy)
- [ ] `fallback-api.e2e.ts` — No Gemini Nano → external API
- [ ] `language-switch.e2e.ts` — Session 1 Italian, Session 2 English

**Agent:** `tdd-enforcer`

### 5.5 Accessibility & Performance
- [ ] Keyboard navigation throughout (Tab, Enter, Escape)
- [ ] ARIA labels on all interactive elements
- [ ] axe-core accessibility audit
- [ ] Lighthouse audit (target: 90+)

**Agent:** `doc-formatter-dev`

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
| Phase 2 | Not started | |
| Phase 3 | Not started | |
| Phase 4 | Not started | |
| Phase 5 | Not started | |

---

## Agent Assignments Summary

| Agent | Phases | Primary Responsibility |
|---|---|---|
| `frontend-dev` | 1, 3, 5 | Language selection, voice recording, formatters, UI polish |
| `ai-integration-dev` | 2, 5 | Gemini Nano, external API, prompt engineering |
| `learning-engine-dev` | 4 | IndexedDB, Dexie.js, pattern analysis, suggestions |
