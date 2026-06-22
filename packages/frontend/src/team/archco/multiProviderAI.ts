/**
 * Multi-provider AI client for ArchCo. Picks the first available provider in
 * priority order (Anthropic → OpenAI → Gemini) and exposes one `complete` call
 * that normalizes request/response shapes across them.
 *
 * Errors are returned as text (never thrown) so the UI can show them without
 * crashing the office.
 */

import { PORTS } from '@archlab/shared';

export type AIProvider = 'anthropic' | 'openai' | 'gemini';

export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  available: boolean;
}

export interface ProviderKeys {
  anthropic?: string;
  openai?: string;
  gemini?: string;
}

/** Human label for a provider's active model, used in badges/tooltips. */
export const PROVIDER_LABEL: Record<AIProvider, string> = {
  anthropic: 'Claude',
  openai: 'GPT-4o',
  gemini: 'Gemini',
};

/** First available provider, Anthropic first. `available:false` when no key. */
export function detectAvailableProvider(apiKeys: ProviderKeys): AIProviderConfig {
  if (apiKeys.anthropic) {
    return { provider: 'anthropic', apiKey: apiKeys.anthropic, model: 'claude-sonnet-4-6', available: true };
  }
  if (apiKeys.openai) {
    return { provider: 'openai', apiKey: apiKeys.openai, model: 'gpt-4o', available: true };
  }
  if (apiKeys.gemini) {
    return { provider: 'gemini', apiKey: apiKeys.gemini, model: 'gemini-2.5-pro', available: true };
  }
  return { provider: 'anthropic', apiKey: '', model: '', available: false };
}

export interface CompletionResult {
  text: string;
  tokensUsed: number;
  /** Set when the call failed; `text` holds a user-facing message. */
  error?: string;
}

/**
 * Calls the backend AI proxy (`/api/ai/complete`) so provider keys stay
 * server-side — no key exposure in the browser and no provider CORS issues.
 */
export async function completeWithProvider(
  config: AIProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1000,
): Promise<CompletionResult> {
  if (!config.available) {
    return { text: 'No AI provider configured. Add an API key in Settings.', tokensUsed: 0, error: 'no-provider' };
  }
  try {
    const res = await fetch(`http://127.0.0.1:${PORTS.backend}/api/ai/complete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        provider: config.provider,
        model: config.model,
        system: systemPrompt,
        user: userPrompt,
        maxTokens,
      }),
    });
    const data = await res.json();
    return {
      text: data?.text ?? '',
      tokensUsed: data?.tokensUsed ?? 0,
      error: data?.error,
    };
  } catch (err) {
    return {
      text: `Could not reach ${PROVIDER_LABEL[config.provider]} via backend: ${err instanceof Error ? err.message : 'network error'}`,
      tokensUsed: 0,
      error: 'network',
    };
  }
}
