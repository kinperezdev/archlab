/**
 * Team debate runner — streams a multi-persona review of a single queue item
 * by calling the Anthropic API once per participating member. The architect
 * speaks last and synthesizes a decision + a Claude Code fix prompt.
 *
 * Token usage from each call is reported via `onTokensUsed` so the caller can
 * track it against Fran's budget.
 */

import { TEAM_MEMBERS } from './teamPersonas.js';
import { completeWithProvider, type AIProviderConfig } from './archco/multiProviderAI.js';

export interface DebateMessage {
  memberId: string;
  memberName: string;
  role: string;
  color: string;
  message: string;
  isStreaming: boolean;
  timestamp: number;
}

export type DebateSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface DebateItem {
  id: string;
  title: string;
  description: string;
  severity: DebateSeverity;
  type: string;
}

/** Which members join the debate, scaled by severity. */
function participantsFor(severity: DebateSeverity): string[] {
  switch (severity) {
    case 'critical':
      return ['backend', 'security', 'sre', 'pm', 'frontend', 'designer', 'architect'];
    case 'high':
      return ['backend', 'security', 'sre', 'architect'];
    case 'medium':
      return ['backend', 'sre', 'architect'];
    default:
      return ['architect'];
  }
}

/**
 * Stream the debate for one item. Yields one message per member. The architect's
 * message includes ACTION:/PROMPT: lines the caller can parse for the decision.
 */
export async function* runItemDebate(
  item: DebateItem,
  projectContext: string,
  providerConfig: AIProviderConfig,
  onTokensUsed: (tokens: number) => void,
): AsyncGenerator<DebateMessage> {
  const memberIds = participantsFor(item.severity);
  const members = TEAM_MEMBERS.filter((m) => memberIds.includes(m.id));
  const conversationHistory: string[] = [];

  for (const member of members) {
    const isArchitect = member.id === 'architect';

    const systemPrompt = `You are ${member.name}, ${member.role} at the ArchCo engineering team.
Personality: ${member.personality}
Focus areas: ${member.focusAreas.join(', ')}
Project context: ${projectContext || 'an existing software project'}

You are in a team review discussing a ${item.severity.toUpperCase()} severity issue.
Stay in character. Be specific — reference the actual finding. Keep it to 3-5 sentences.
${
  isArchitect
    ? 'As architect, synthesize the team discussion and give a final decision with a specific action item.'
    : 'Respond naturally; agree or disagree with previous speakers when appropriate.'
}`;

    const userPrompt = isArchitect
      ? `Team discussion so far:\n${conversationHistory.join('\n\n')}\n\nAs ${member.name}, synthesize and make the final call. End with two lines exactly:\nACTION: [specific next step]\nPROMPT: [one-sentence Claude Code prompt to fix this]`
      : `Issue being reviewed:\nTitle: ${item.title}\nDescription: ${item.description || item.title}\nSeverity: ${item.severity}\n\nPrevious discussion:\n${
          conversationHistory.join('\n\n') || '(you are first to speak)'
        }\n\nAs ${member.name}, respond in 3-5 sentences.`;

    const { text, tokensUsed, error } = await completeWithProvider(
      providerConfig,
      systemPrompt,
      userPrompt,
      300,
    );
    if (tokensUsed > 0) onTokensUsed(tokensUsed);
    const message = error ? `(${member.name}: ${text})` : text || `(${member.name} had nothing to add.)`;

    conversationHistory.push(`${member.name} (${member.role}): ${message}`);

    yield {
      memberId: member.id,
      memberName: member.name,
      role: member.role,
      color: member.color,
      message,
      isStreaming: false,
      timestamp: Date.now(),
    };
  }
}

/** Pull ACTION:/PROMPT: lines out of the architect's closing message. */
export function parseArchitectDecision(message: string): { decision: string; fixPrompt: string } {
  const actionMatch = message.match(/ACTION:\s*(.+)/i);
  const promptMatch = message.match(/PROMPT:\s*(.+)/i);
  const decision = actionMatch?.[1]?.trim() || message.trim();
  const fixPrompt = promptMatch?.[1]?.trim() || '';
  return { decision, fixPrompt };
}
