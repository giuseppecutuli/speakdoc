# Speak Doc — AI Documentation Tool

Browser webapp: record voice → AI generates structured docs → copy to Confluence/Notion.

## Stack
React 18 + TypeScript + Vite | Zustand | Dexie.js (IndexedDB) | Zod | Tailwind + shadcn/ui | Vitest + Playwright | assemblyai (cloud STT)

## Speech-to-Text Strategy (Settings-driven)
User choice in **Settings → Speech Recognition** (`speech-preference.ts`, key `STORAGE_KEYS.SPEECH_PROVIDER`):
- **Auto** — Web Speech API if the browser supports it; otherwise AssemblyAI batch (requires API key)
- **Web Speech API** — real-time transcription on the mic via `WebSpeechProvider` + `SpeechProviderManager`
- **AssemblyAI (after recording)** — mic records audio only; on **Stop**, `AssemblyAIService.transcribe()` runs (same batch API as file import)

`AssemblyAIProvider` (streaming WebSocket) remains in the codebase for tests/providers but is **not** used by `VoiceRecorder`.

Also: **AssemblyAI batch** on file upload via `AudioFileImporter`. API key in localStorage only; see `AssemblyAIGuide`.

## AI Strategy
1. **Gemini Nano** (`window.ai.languageModel`) — Chrome 123+ with experimental flag
2. **External API fallback** — user-configured OpenAI-compatible endpoint (default: LM Studio `localhost:1234`)

No backend. Static deployment. API keys in localStorage only.

## Languages (MVP)
English + Italian only. User selects **speaking language** and **output language** independently before recording. Languages locked during session. Persisted to localStorage.

## Key Paths
```
src/
  features/
    language-selection/       ✅ Phase 1
    voice-input/
      ├── speech-preference.ts   # load/save/migrate preference + resolve capture mode
      ├── providers/          ✅ WebSpeech; AssemblyAI streaming (not used by VoiceRecorder)
      ├── assemblyai.service.ts  ✅ batch transcription (mic stop + file import)
      └── (whisper files removed in Phase 1c)
    ai-integration/            ✅ Phase 2
    transcription/             ✅ Phase 1
    documentation-generation/  ✅ Phase 3
    learning/
      ├── repositories/        ✅ Phase 4 (ISessionRepository, IndexedDB impl)
      │   ├── IDraftRepository.ts         ✅ multi-row drafts + active draft id
      │   └── IndexedDBDraftRepository.ts ✅
    export/                    ✅ Phase 3, 4
  components/
    ├── DraftRestoreBanner.tsx  ✅
    └── InProgressDrafts.tsx    ✅ list + restore/delete IndexedDB drafts
  hooks/
    └── useDraftPersistence.ts  ✅ debounced save; ties to active draft row
  components/  hooks/  types/  constants/  utils/
docs/PRD.md  ARCHITECTURE.md  TASKS.md
.claude/agents/  (frontend-dev, ai-integration-dev, learning-engine-dev)
  utils/repositories.ts  ← single swap point for IndexedDB → Supabase migration
```

## Phase Status
| Phase | Status | Tests |
|---|---|---|
| 1 | ✅ Complete | 49 |
| 1a | ✅ Complete | +38 (87 total) |
| 1b | ✅ Superseded | replaced by Phase 1c |
| 1c | ✅ Complete | AssemblyAI batch; mic modes (Web vs record→transcribe) |
| 2 | ✅ Complete | 98 |
| 3 | ✅ Complete | 121 |
| 4 | ✅ Complete | +25 (186 total) |
| 5 | ✅ Complete | 229 |
| 6 | 🟡 Partial | Drafts multi-row, in-progress list, session audio + default names |

## Agents
| Agent | Use For |
|---|---|
| `frontend-dev` | Language modal, voice recording, speech providers, formatters, UI |
| `ai-integration-dev` | Gemini Nano, external API, AssemblyAI, prompt engineering |
| `learning-engine-dev` | IndexedDB/Dexie, pattern analysis, suggestions |

> Unit tests live inside each agent's checklist. No separate test agent needed.

## Rules
- Language selection gates recording — never skip it
- AI fallback is mandatory — never assume Gemini Nano available
- Speech capture: **Auto** resolves Web Speech vs AssemblyAI batch (`resolve_voice_capture_mode`); explicit modes in Settings if the user wants to force one path
- Immutable state — Zustand `set()` always creates new objects
- TDD — tests before implementation, 80%+ coverage
- No hardcoded secrets — API keys in localStorage via Settings UI
- Repository pattern — all DB access via `ISessionRepository`/`IFeedbackRepository`/`IDraftRepository`; swap `utils/repositories.ts` to migrate to Supabase
