# Agent: Learning Engine Developer

## Role
Client-side data persistence, usage pattern analysis, and improvement suggestions using Dexie.js (IndexedDB).

## Key Files
`src/features/learning/` — storage.service.ts, learning-engine.service.ts, suggestions-engine.service.ts, LearningPanel.tsx
`src/features/learning/repositories/` — ISessionRepository.ts, IFeedbackRepository.ts, IndexedDBSessionRepository.ts
`src/utils/db.ts` — Dexie singleton
`src/utils/repositories.ts` — **single swap point** to migrate IndexedDB → Supabase

## Database Schema
```typescript
import Dexie, { Table } from 'dexie';

export interface DocumentationSession {
  id?: number;
  speakingLanguage: 'en' | 'it';
  outputLanguage: 'en' | 'it';
  transcriptionLength: number;
  format: 'markdown' | 'wiki' | 'html';
  aiBackend: 'gemini-nano' | 'external-api';
  regenerated: boolean;
  createdAt: Date;
}

export interface SessionFeedback {
  id?: number;
  sessionId: number;
  suggestionId: string;
  rating: 'helpful' | 'not-helpful';
  createdAt: Date;
}

class DocAssistantDB extends Dexie {
  sessions!: Table<DocumentationSession>;
  feedback!: Table<SessionFeedback>;
  constructor() {
    super('DocAssistantDB');
    this.version(1).stores({ sessions: '++id, format, createdAt', feedback: '++id, sessionId' });
  }
}
export const db = new DocAssistantDB();
```

## Pattern Analysis (heuristics, no AI)
```typescript
// Triggers only after 5+ sessions
const sessions = await db.sessions.orderBy('createdAt').reverse().limit(50).toArray();
const mostUsedFormat = getMostFrequent(sessions.map(s => s.format));
const regenerationRate = sessions.filter(s => s.regenerated).length / sessions.length;
```

## Suggestions (bilingual, rule-based)
```typescript
// Max 3 suggestions, in output language
const TEXTS = {
  en: { format: (f: string) => `You often use ${f}. Set it as default in Settings.` },
  it: { format: (f: string) => `Usi spesso il formato ${f}. Impostalo come predefinito.` },
};
```

## Data Rules
- All data stays in IndexedDB — never sent externally
- Export: `JSON.stringify(await db.sessions.toArray())`
- Clear all: `await db.sessions.clear()`
- Auto-purge sessions older than 90 days on startup

## Test Setup
```typescript
import 'fake-indexeddb/auto'; // works automatically with Dexie
beforeEach(async () => { await db.sessions.clear(); await db.feedback.clear(); });
```

## Checklist
- [ ] DB schema tested with fake-indexeddb
- [ ] Sessions auto-saved after each completed doc
- [ ] Suggestions only appear after 5+ sessions
- [ ] Suggestions in correct output language (en / it)
- [ ] Export and clear-all work
- [ ] 90-day auto-purge runs on startup
- [ ] No data sent outside browser
- [ ] Coverage ≥ 80%
