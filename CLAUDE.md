# Speak Doc — AI Documentation Tool

Browser webapp: record voice → AI generates structured docs → copy to Confluence/Notion.

## Stack
React 18 + TypeScript + Vite | Zustand | Dexie.js (IndexedDB) | Zod | Tailwind + shadcn/ui | Vitest + Playwright

## AI Strategy
1. **Gemini Nano** (`window.ai.languageModel`) — Chrome 123+ with experimental flag
2. **External API fallback** — user-configured OpenAI-compatible endpoint (default: LM Studio `localhost:1234`)

No backend. Static deployment. API keys in localStorage only.

## Languages (MVP)
English + Italian only. User selects **speaking language** and **output language** independently before recording. Languages locked during session. Persisted to localStorage.

## Key Paths
```
src/
  features/language-selection/  voice-input/  ai-integration/
  transcription/  documentation-generation/  learning/  export/
  components/  hooks/  types/  constants/  utils/
docs/PRD.md  ARCHITECTURE.md  TASKS.md
.claude/agents/  (frontend-dev, ai-integration-dev, learning-engine-dev)
  utils/repositories.ts  ← single swap point for IndexedDB → Supabase migration
```

## Agents
| Agent | Use For |
|---|---|
| `frontend-dev` | Language modal, voice recording, formatters, UI |
| `ai-integration-dev` | Gemini Nano, external API, prompt engineering |
| `learning-engine-dev` | IndexedDB/Dexie, pattern analysis, suggestions |

> Unit tests live inside each agent's checklist. No separate test agent needed.

## Rules
- Language selection gates recording — never skip it
- AI fallback is mandatory — never assume Gemini Nano available
- Immutable state — Zustand `set()` always creates new objects
- TDD — tests before implementation, 80%+ coverage
- No hardcoded secrets — API keys in localStorage via Settings UI
- Repository pattern — all DB access via `ISessionRepository`/`IFeedbackRepository`; swap `utils/repositories.ts` to migrate to Supabase
