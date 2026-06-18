/**
 * Global API key + Agent Team confidence context.
 *
 * Exposes whether an Anthropic key is configured and whether the Agent Team has
 * run, so any component can render honest confidence indicators (static vs.
 * AI-enhanced) without prop drilling. Also carries the modal openers so nudges
 * can be clickable everywhere.
 */

import { createContext, useContext } from 'react';

export interface ApiKeyContextValue {
  /** True when an Anthropic key exists in the stored keys. */
  hasApiKey: boolean;
  /** True once the Agent Team has produced at least one run. */
  agentTeamHasRun: boolean;
  /** ISO timestamp of the most recent Agent Team run, or null. */
  lastAgentRunAt: string | null;
  /** Open the Agent Team modal. */
  openAgentTeam: () => void;
  /** Open the API Keys modal. */
  openApiKeys: () => void;
}

const noop = () => {};

export const ApiKeyContext = createContext<ApiKeyContextValue>({
  hasApiKey: false,
  agentTeamHasRun: false,
  lastAgentRunAt: null,
  openAgentTeam: noop,
  openApiKeys: noop,
});

/** Read the global API key / Agent Team confidence context. */
export function useApiKeyContext(): ApiKeyContextValue {
  return useContext(ApiKeyContext);
}
