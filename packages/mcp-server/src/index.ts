#!/usr/bin/env node
/**
 * ArchLab local MCP server.
 *
 * Exposes the global brain to any MCP-aware AI tool (e.g. Claude Code) so the
 * AI reads full historical context before executing any task. Transport is
 * stdio; it never opens a network socket and never sends data externally.
 *
 * Tools:
 *   - brain_overview      : counts + cross-project patterns + insights
 *   - list_projects       : every analyzed project with its summary
 *   - get_project         : full intelligence + diagnostics for one project
 *   - search_patterns     : find learned patterns by keyword
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readBrain } from './brainReader.js';
import { getPermissions, isLocked, LOCKED_MESSAGE } from './access.js';

/** Shorthand for the locked-brain response every tool returns when gated. */
const locked = () => ({ content: [{ type: 'text' as const, text: LOCKED_MESSAGE }] });

const server = new McpServer({
  name: 'archlab-brain',
  version: '0.1.0',
});

// A high-level snapshot the AI can read first, every time.
server.tool(
  'brain_overview',
  'Global ArchLab brain overview: project count, cross-project patterns, and proactive insights learned across every analyzed project.',
  {},
  async () => {
    if (isLocked()) return locked();
    const brain = readBrain();
    const perms = getPermissions();
    const visibleProjects = brain.projects.filter(
      (p) => !perms.lockedProjects.includes(p.projectId),
    );
    const text = [
      `# ArchLab Global Brain`,
      `Updated: ${brain.updatedAt}`,
      `Projects analyzed: ${visibleProjects.length}`,
      ``,
      `## Cross-project patterns (${perms.patterns ? brain.patterns.length : 'blocked'})`,
      ...(perms.patterns
        ? brain.patterns
            .sort((a, b) => b.count - a.count)
            .map((p) => `- [${p.category}] ${p.description} (seen ${p.count}x)`)
        : ['- (patterns access is blocked by brain permissions)']),
      ``,
      `## Proactive insights (${perms.insights ? brain.insights.length : 'blocked'})`,
      ...(perms.insights
        ? brain.insights.map((i) => `- ${i.message}`)
        : ['- (insights access is blocked by brain permissions)']),
    ].join('\n');
    return { content: [{ type: 'text', text }] };
  },
);

server.tool(
  'list_projects',
  'List every project ArchLab has analyzed, with a one-line summary each.',
  {},
  async () => {
    if (isLocked()) return locked();
    const brain = readBrain();
    const perms = getPermissions();
    const text =
      brain.projects
        .filter((p) => !perms.lockedProjects.includes(p.projectId))
        .map((p) => `- ${p.name} (${p.projectId}): ${p.intelligence.summary}`)
        .join('\n') || 'No projects analyzed yet.';
    return { content: [{ type: 'text', text }] };
  },
);

server.tool(
  'get_project',
  'Get the full intelligence report and diagnostics for one analyzed project by id or name.',
  { idOrName: z.string().describe('Project id or name') },
  async ({ idOrName }) => {
    if (isLocked()) return locked();
    const brain = readBrain();
    const perms = getPermissions();
    const q = idOrName.toLowerCase();
    const project = brain.projects.find(
      (p) => p.projectId === idOrName || p.name.toLowerCase() === q,
    );
    if (!project || perms.lockedProjects.includes(project.projectId)) {
      // Locked projects are indistinguishable from missing ones to the AI.
      return { content: [{ type: 'text', text: `No project matching "${idOrName}".` }] };
    }
    // Strip per-project findings when that permission is off.
    const served = perms.projectFindings
      ? project
      : { ...project, report: { ...project.report, diagnostics: [] } };
    return { content: [{ type: 'text', text: JSON.stringify(served, null, 2) }] };
  },
);

server.tool(
  'search_patterns',
  'Search learned cross-project patterns by keyword (e.g. "auth", "sql", "scaling").',
  { keyword: z.string().describe('Keyword to search pattern descriptions') },
  async ({ keyword }) => {
    if (isLocked()) return locked();
    if (!getPermissions().patterns) {
      return { content: [{ type: 'text', text: 'Patterns access is blocked by brain permissions.' }] };
    }
    const brain = readBrain();
    const k = keyword.toLowerCase();
    const hits = brain.patterns.filter(
      (p) => p.description.toLowerCase().includes(k) || p.category.toLowerCase().includes(k),
    );
    const text =
      hits.map((p) => `- [${p.category}] ${p.description} (seen ${p.count}x)`).join('\n') ||
      `No patterns matching "${keyword}".`;
    return { content: [{ type: 'text', text }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
// eslint-disable-next-line no-console
console.error('[archlab-mcp] brain MCP server ready on stdio');
