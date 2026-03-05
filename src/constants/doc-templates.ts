export type TemplateId = 'generic' | 'meeting-notes' | 'tech-spec' | 'adr' | 'bug-report';

export interface DocTemplate {
  id: TemplateId;
  label: string;
  promptModifier: string; // Appended to the base system prompt when non-generic
}

export const DOC_TEMPLATES: Record<TemplateId, DocTemplate> = {
  generic: {
    id: 'generic',
    label: 'Generic',
    promptModifier: '',
  },
  'meeting-notes': {
    id: 'meeting-notes',
    label: 'Meeting Notes',
    promptModifier:
      '\n\n## Template Override: Meeting Notes\nStructure the output as meeting notes. Include: Date/Attendees (infer from context), Agenda items, Key decisions made, Action items with owners and deadlines, Next steps. Use a clear, scannable format.',
  },
  'tech-spec': {
    id: 'tech-spec',
    label: 'Tech Spec',
    promptModifier:
      '\n\n## Template Override: Technical Specification\nStructure as a technical specification. Include: Overview & Goals, Problem Statement, Proposed Solution, Architecture Decisions, API/Interface Contracts, Implementation Plan, Testing Strategy, Risks & Mitigations.',
  },
  adr: {
    id: 'adr',
    label: 'ADR (Architecture Decision)',
    promptModifier:
      '\n\n## Template Override: Architecture Decision Record (ADR)\nFormat as an ADR. Include: Title, Status (Proposed/Accepted/Deprecated), Context (why this decision is needed), Decision (what was decided), Consequences (trade-offs and implications), Alternatives considered.',
  },
  'bug-report': {
    id: 'bug-report',
    label: 'Bug Report',
    promptModifier:
      '\n\n## Template Override: Bug Report\nFormat as a structured bug report. Include: Summary, Steps to Reproduce, Expected Behavior, Actual Behavior, Environment/Version info, Severity/Priority, Root Cause Analysis (if mentioned), Proposed Fix (if mentioned).',
  },
};

export const DEFAULT_TEMPLATE_ID: TemplateId = 'generic';
export const TEMPLATE_IDS = Object.keys(DOC_TEMPLATES) as TemplateId[];
