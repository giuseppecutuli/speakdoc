# Product Requirements Document
## Speak Doc — AI-Powered Documentation Tool

**Version:** 1.3
**Status:** Approved
**Last Updated:** 2026-03-06

---

## Problem Statement

Technical workers (developers, analysts, architects) spend significant time writing documentation. When documenting verbally (in meetings, during code reviews, or while thinking through a problem), the notes are lost or never structured. Non-English speakers are further disadvantaged because they think naturally in their native language but need to produce English documentation.

---

## Solution

A browser-based tool that:
1. Records the user's voice
2. Transcribes in the user's speaking language (e.g., Italian)
3. Uses AI to generate structured, professional documentation in the user's target language (e.g., English)
4. Outputs in a format ready to paste into Confluence, Notion, or any wiki tool
5. Learns from usage patterns to improve suggestions over time

---

## Users

**Primary:** Individual technical contributors (developers, architects, tech leads) who:
- Document their work verbally rather than typing
- Are non-English native speakers working in English-language organizations
- Need to produce Confluence/Notion docs regularly

**Secondary:** Teams adopting documentation-as-voice workflows.

---

## MVP Scope (Phase 1-6)

### In Scope

| Feature | Priority | Phase |
|---|---|---|
| Language selection modal (speaking + output language) | P0 | 1 |
| Voice recording via Web Speech API + MediaRecorder | P0 | 1 |
| Waveform visualization during recording | P1 | 1 |
| Gemini Nano (Chrome built-in) AI integration | P0 | 2 |
| User-configurable external API fallback (OpenAI-compatible) | P0 | 2 |
| Multilingual prompt generation (it↔en) | P0 | 2 |
| Markdown output format | P0 | 3 |
| Confluence Wiki Markup output format | P0 | 3 |
| HTML preview | P1 | 3 |
| Copy to clipboard | P0 | 3 |
| In-editor documentation refinement | P1 | 3 |
| Session storage in IndexedDB | P1 | 4 |
| Usage pattern analysis | P1 | 4 |
| Improvement suggestions | P2 | 4 |
| Keyboard shortcuts | P2 | 5 |
| Dark mode | P2 | 5 |
| Settings UI (API endpoint, API key) | P0 | 2 |
| Language persistence across sessions | P1 | 1 |
| Audio playback after recording | P1 | 3 |
| Audio export (download recording as file) | P1 | 4 |
| Audio file import for Whisper transcription | P2 | 4 |
| Documentation template selection (Meeting Notes, Tech Spec, ADR, Bug Report) | P1 | 4 |
| Session history browser (list, preview, re-export) | P1 | 4 |
| AI inline editing (improve selected text or full doc via prompt) | P1 | 4 |
| Revision history / undo for AI edits | P1 | 4 |
| Restore completed session from history into editor | P1 | 6 |
| Draft auto-save (transcription + doc + audio) survives page refresh | P1 | 6 |

### Out of Scope (MVP)

- Cloud sync / user accounts
- Real-time collaboration
- Mobile recording (read-only on mobile)
- More than 2 languages (expand post-MVP)
- Backend server / database
- Audio storage in cloud (defer to Supabase integration phase)
- Direct Confluence/Notion API push (post-MVP)

---

## Functional Requirements

### FR-01: Language Selection

- **FR-01.1** — The app MUST display a language selection modal before the first recording of each session
- **FR-01.2** — The user MUST be able to select a "speaking language" independently from the "output language"
- **FR-01.3** — Languages MUST be locked (non-changeable) once recording starts
- **FR-01.4** — Selected languages MUST persist to localStorage and be pre-filled on next session
- **FR-01.5** — MVP supports English (en) and Italian (it) only

### FR-02: Voice Recording

- **FR-02.1** — The app MUST request microphone permission before recording
- **FR-02.2** — Recording MUST use the Web Speech API for transcription with the selected speaking language
- **FR-02.3** — A waveform visualization MUST show real-time audio activity
- **FR-02.4** — The user MUST be able to pause and resume recording
- **FR-02.5** — The user MUST be able to stop and finalize recording
- **FR-02.6** — Transcription MUST update in real-time as speech is detected
- **FR-02.7** — Recording sessions of 40+ minutes MUST be supported without accuracy degradation or memory issues; when using Whisper WASM, audio MUST be chunked into ≤30 s segments and transcribed serially
- **FR-02.8** — A live elapsed-time counter (MM:SS) MUST be displayed during recording

### FR-03: AI Processing

- **FR-03.1** — The app MUST first attempt to use Gemini Nano (Chrome built-in AI)
- **FR-03.2** — If Gemini Nano is unavailable, the app MUST fall back to the user-configured external API
- **FR-03.3** — If no API is configured, the app MUST prompt the user to configure one
- **FR-03.4** — The AI system prompt MUST be language-pair specific (it→en uses a dedicated prompt)
- **FR-03.5** — AI responses MUST stream incrementally (not wait for completion)

### FR-04: Documentation Generation

- **FR-04.1** — Generated docs MUST be in the selected output language
- **FR-04.2** — Output MUST include: title, summary, key points, action items
- **FR-04.3** — The user MUST be able to switch between output formats: Markdown, Wiki, HTML
- **FR-04.4** — The user MUST be able to edit the generated documentation before copying
- **FR-04.5** — One-click copy to clipboard MUST work for all formats

### FR-07: Audio Management

- **FR-07.1** — After recording stops, the app MUST offer in-app audio playback via an `<audio>` element
- **FR-07.2** — The user MUST be able to download the recording as a file (`.webm` on Chrome/Firefox, `.mp4` on Safari)
- **FR-07.3** — When Whisper is the active speech provider, the user MAY upload an existing audio file for transcription
- **FR-07.4** — Uploaded audio files MUST be capped at 50 MB with a clear validation error if exceeded
- **FR-07.5** — Uploaded audio files MUST NOT be stored persistently — processed in-memory only

### FR-08: Documentation Templates

- **FR-08.1** — The user MUST be able to select a documentation template before generating docs
- **FR-08.2** — Built-in templates: Generic (default), Meeting Notes, Technical Specification, ADR (Architecture Decision Record), Bug Report
- **FR-08.3** — Template selection MUST influence the AI system prompt (additive — appended to the base language-pair prompt)
- **FR-08.4** — Selected template MUST persist to localStorage and pre-fill on next session
- **FR-08.5** — Template can be changed at any time before or after recording (does not lock like language)

### FR-09: AI Inline Editing

- **FR-09.1** — The user MUST be able to select text in the Markdown or Wiki editor and trigger an AI improvement prompt on the selection
- **FR-09.2** — A floating toolbar MUST appear above the selection with an "Improve with AI" button
- **FR-09.3** — The user MUST be able to enter a free-text instruction (e.g., "make it more formal", "shorten this")
- **FR-09.4** — The AI MUST rewrite ONLY the selected text and replace it inline; no other content must change
- **FR-09.5** — The user MUST be able to trigger AI improvement on the entire document (not just a selection) via a dedicated button in the editor toolbar
- **FR-09.6** — AI improvement MUST reuse the existing AI backend (Gemini Nano or external API) — no separate model needed
- **FR-09.7** — The HTML Preview tab MUST NOT support inline editing; a tooltip MUST explain the limitation
- **FR-09.8** — Instruction input MUST be capped at 500 characters with validation

### FR-10: Revision History (Undo)

- **FR-10.1** — Before any AI-driven content replacement (inline or full-doc), the app MUST snapshot the current document state
- **FR-10.2** — An "Undo" button MUST appear in the editor toolbar after any AI edit, allowing the user to revert to the previous snapshot
- **FR-10.3** — A "Redo" button MUST allow moving forward again after an undo
- **FR-10.4** — History MUST be session-scoped (in-memory only, not persisted to IndexedDB)
- **FR-10.5** — History stack MUST be capped at 20 snapshots to prevent memory issues

### FR-11: Session Persistence & Restore

- **FR-11.1** — The user MUST be able to restore any completed session from the Session History browser directly into the editor (transcription + generated doc + language pair)
- **FR-11.2** — A "Restore" button MUST appear in each expanded session row alongside Copy and Download
- **FR-11.3** — Restoring a session MUST NOT require the user to re-open the language selection modal
- **FR-11.4** — The app MUST auto-save the current working state (transcription, generated doc, format, language pair, audio blob) to IndexedDB within 1 second of any change
- **FR-11.5** — On page reload, if a draft < 24 hours old exists and the current session is empty, a restore banner MUST appear offering to restore or discard
- **FR-11.6** — The user MUST be able to discard the draft (banner disappears, draft cleared from IndexedDB)
- **FR-11.7** — Audio blobs MUST be included in the draft only if ≤ 25 MB; larger blobs are silently excluded
- **FR-11.8** — Only one draft at a time is stored (new auto-save replaces the previous draft)
- **FR-11.9** — Draft MUST be cleared when the user explicitly resets the session (Regenerate / start new session)

### FR-05: Learning System

- **FR-05.1** — Each completed session MUST be stored in IndexedDB with metadata (language pair, format used, timestamp)
- **FR-05.2** — The system MUST analyze usage patterns after 5+ sessions
- **FR-05.3** — Suggestions MUST be generated in the output language
- **FR-05.4** — The user MUST be able to rate suggestions (helpful / not helpful)
- **FR-05.5** — The user MUST be able to export or clear their learning data

### FR-06: Settings

- **FR-06.1** — User MUST be able to set external API endpoint URL
- **FR-06.2** — User MUST be able to set API key (stored in localStorage, never transmitted elsewhere)
- **FR-06.3** — User MUST see which AI backend is currently active (Gemini Nano / External API / None)

---

## Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-01 | App must load in < 2 seconds on modern hardware |
| NFR-02 | No data sent externally unless user explicitly configures an API |
| NFR-03 | Works offline when Gemini Nano is the active backend |
| NFR-04 | Test coverage ≥ 80% (unit + integration) |
| NFR-05 | WCAG 2.1 AA accessibility compliance |
| NFR-06 | Lighthouse performance score ≥ 90 |
| NFR-07 | No backend server required — fully static deployment |
| NFR-08 | API keys stored only in localStorage, never in source code |

---

## UX Flow

```
1. App opens
   ├── (If unsaved draft < 24 h old) → "Restore previous session?" banner → [Restore] or [Discard]
   └── Language selection modal appears
       ├── Speaking language: [Italian ▼]
       └── Output language:   [English ▼]
           └── [Start Recording]

2. Recording in progress
   ├── Waveform visualization (animated)
   ├── Live transcription panel (Italian text appears)
   └── [Stop Recording]
       OR
   ├── [Upload Audio File] (Whisper provider only) → file picker → transcription

3. Post-Recording
   ├── Audio playback bar (play/pause the just-recorded audio)
   ├── [Download Recording] → saves .webm/.mp4 file
   └── [Generate Documentation]

4. AI Processing
   ├── "Generating documentation..." (streaming)
   └── English documentation appears incrementally

5. Documentation Editor
   ├── Template selector dropdown (Generic / Meeting Notes / Tech Spec / ADR / Bug Report)
   ├── [Markdown] [Wiki] [HTML] tabs
   ├── Editable text area
   │   └── Select text → floating "Improve with AI" button → enter instruction → AI rewrites selection
   ├── Toolbar: [Undo] [Redo] [Improve Doc] [Regenerate] [Copy to Clipboard]
   ├── [Download as file] → saves .md/.txt/.html
   └── [Save Session] → stored in IndexedDB

6. (After 5+ sessions)
   └── Suggestions panel appears with improvement tips

7. Session History
   └── List of past sessions → expand → [Copy] [Download] [Restore]
       └── [Restore] → populates editor with session's transcription + doc (no modal re-open)
```

---

## Success Metrics

| Metric | Target |
|---|---|
| Voice to formatted doc time | < 30 seconds |
| Test coverage | ≥ 80% |
| Lighthouse performance | ≥ 90 |
| Supported language pairs | en↔it (MVP) |
| Offline capability | 100% when using Gemini Nano |
