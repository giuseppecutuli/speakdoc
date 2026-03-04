export type OutputFormat = 'markdown' | 'wiki' | 'html';

export interface DocumentationOutput {
  rawAIResponse: string;
  formattedOutput: string;
  format: OutputFormat;
}
