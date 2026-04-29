export type OutputFormat = 'markdown' | 'wiki' | 'html';

const OUTPUT_FORMATS = ['markdown', 'wiki', 'html'] as const satisfies readonly OutputFormat[];

/** Normalizes wire/storage strings to {@link OutputFormat} (e.g. draft `format` field). */
export function coerceOutputFormat(value: string, fallback: OutputFormat = 'markdown'): OutputFormat {
  return (OUTPUT_FORMATS as readonly string[]).includes(value) ? (value as OutputFormat) : fallback;
}

export interface DocumentationOutput {
  rawAIResponse: string;
  formattedOutput: string;
  format: OutputFormat;
}
