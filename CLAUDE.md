# Speak Doc — AI Documentation Tool

Browser webapp: record voice → AI generates structured docs → copy to Confluence/Notion.

## Stack
React 18 + TypeScript + Vite | Zustand | Dexie.js (IndexedDB) | Zod | Tailwind + shadcn/ui | Vitest + Playwright | @xenova/transformers (Whisper WASM)

## Speech-to-Text Strategy (Dual Provider)
1. **Web Speech API** (default) — Real-time interim results, ~70–90% accuracy, no setup required
2. **Whisper WASM** (optional, Phase 1b) — ~95–99% accuracy, offline, first use downloads model (~45–150 MB)
   - User selects provider and model size in Settings
   - Model cached in IndexedDB for subsequent uses

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
      ├── providers/          ✅ Phase 1a (WebSpeech), ✅ Phase 1b (Whisper)
      ├── whisper.service.ts  ✅ Phase 1b
      └── whisper-model-cache.ts ✅ Phase 1b
    ai-integration/            ✅ Phase 2
    transcription/             ✅ Phase 1
    documentation-generation/  ✅ Phase 3
    learning/                  ✅ Phase 4
    export/                    ✅ Phase 3, 4
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
| 1b | ✅ Complete | +40 (161 total) |
| 2 | ✅ Complete | 98 |
| 3 | ✅ Complete | 121 |
| 4 | ✅ Complete | +25 (186 total) |
| 5 | 🔲 Not started | - |

## Agents
| Agent | Use For |
|---|---|
| `frontend-dev` | Language modal, voice recording, speech providers, formatters, UI |
| `ai-integration-dev` | Gemini Nano, external API, Whisper WASM, prompt engineering |
| `learning-engine-dev` | IndexedDB/Dexie, Whisper model cache, pattern analysis, suggestions |

> Unit tests live inside each agent's checklist. No separate test agent needed.

## Rules
- Language selection gates recording — never skip it
- AI fallback is mandatory — never assume Gemini Nano available
- Speech provider fallback is mandatory — gracefully degrade Web Speech → Whisper → error
- Immutable state — Zustand `set()` always creates new objects
- TDD — tests before implementation, 80%+ coverage
- No hardcoded secrets — API keys in localStorage via Settings UI
- Repository pattern — all DB access via `ISessionRepository`/`IFeedbackRepository`; swap `utils/repositories.ts` to migrate to Supabase
