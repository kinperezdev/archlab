/**
 * Builders for fully-formed, paste-ready AI prompts.
 *
 * Every prompt is self-contained: it states what the issue or task is, where it
 * lives in the codebase, and exactly what the AI should produce, so pasting it
 * into Claude Code (or any AI tool) yields an actionable response with no extra
 * context required from the user.
 */

import type { Diagnostic } from '@archlab/shared';

/** Humanize a pipeline step id, e.g. "security-checks" -> "security". */
function stepLabel(step: string): string {
  return step.replace(/-checks?$/, '').replace(/-/g, ' ');
}

/** Prompt to fix a single diagnostic / finding. */
export function promptForDiagnostic(
  d: Diagnostic,
  opts: { projectName?: string | null; filePath?: string | null } = {},
): string {
  const where = opts.filePath ? ` at \`${opts.filePath}\`` : '';
  const project = opts.projectName ? ` "${opts.projectName}"` : '';

  const lines = [
    `In my project${project}${where} there is a ${d.severity.toUpperCase()} ${stepLabel(
      d.step,
    )} issue: ${d.title}.`,
    '',
    `What is wrong: ${d.what}`,
    `Why it matters: ${d.why}`,
    `How it should be fixed: ${d.howToFix}`,
  ];
  if (d.optimization) lines.push(`How to optimize further: ${d.optimization}`);
  lines.push('', 'Please fix this and show me the corrected code, explaining the change.');

  return lines.join('\n');
}

/** Prompt to implement a suggested feature / improvement. */
export function promptForSuggestion(suggestion: string, projectName?: string | null): string {
  const project = projectName ? ` "${projectName}"` : '';
  return [
    `In my project${project} I want to implement the following improvement: ${suggestion}.`,
    '',
    'Please plan the change, write the necessary code, and explain each step so I can apply it.',
  ].join('\n');
}

/**
 * Prompt to implement a missing architecture capability, with project path and
 * the current architecture context so the AI knows exactly where to add code.
 */
export function promptForArchitectureSuggestion(
  suggestion: string,
  opts: { projectPath?: string | null; context?: string | null } = {},
): string {
  const at = opts.projectPath ? ` at \`${opts.projectPath}\`` : '';
  const lines = [
    `My project${at} is missing the following: ${suggestion}.`,
  ];
  if (opts.context) {
    lines.push('', `Here is the current architecture context: ${opts.context}`);
  }
  lines.push(
    '',
    'Please implement this and show me exactly which files to create or change and where the code should go.',
  );
  return lines.join('\n');
}

/** Prompt to fix a scale/architecture bottleneck, with threshold context. */
export function promptForBottleneck(
  d: Diagnostic,
  opts: { projectPath?: string | null; filePath?: string | null } = {},
): string {
  const where = opts.filePath ? ` at \`${opts.filePath}\`` : opts.projectPath ? ` at \`${opts.projectPath}\`` : '';
  const lines = [
    `My project${where} has a ${d.bottleneckType ?? 'scale'} bottleneck: ${d.title}.`,
    '',
    `What it is: ${d.what}`,
    `Why it becomes a problem at scale: ${d.why}`,
  ];
  if (d.userThreshold) lines.push(`Scale estimate: ${d.userThreshold}.`);
  lines.push(
    `How to fix it architecturally: ${d.howToFix}`,
    `Further optimization: ${d.optimization}`,
    '',
    'Please implement this fix, show me the exact code changes and where they go, and explain the trade-offs.',
  );
  return lines.join('\n');
}

/** Prompt to act on a brain insight that spans the user's projects. */
export function promptForInsight(insight: string): string {
  return [
    `Across my projects I keep seeing this pattern: ${insight}.`,
    '',
    'Please explain what is driving it and give me a concrete, reusable way to address it in code.',
  ].join('\n');
}

/** Prompt to evolve a database schema, given the current SQL and a request. */
export function promptForSchema(currentSql: string, request: string): string {
  return [
    `Here is my current database schema:`,
    '',
    '```sql',
    currentSql.trim() || '-- (empty schema)',
    '```',
    '',
    `Based on this, here is what needs to be added or changed: ${request}`,
    '',
    'Please write the SQL for the change and explain what it does and why.',
  ].join('\n');
}
