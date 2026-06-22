/**
 * Multi-provider AI client for ArchCo. Picks the first available provider in
 * priority order (Anthropic → OpenAI → Gemini) and exposes one `complete` call
 * that normalizes request/response shapes across them.
 *
 * Errors are returned as text (never thrown) so the UI can show them without
 * crashing the office.
 */

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
    return { provider: 'gemini', apiKey: apiKeys.gemini, model: 'gemini-1.5-pro', available: true };
  }
  return { provider: 'anthropic', apiKey: '', model: '', available: false };
}

export interface CompletionResult {
  text: string;
  tokensUsed: number;
  /** Set when the call failed; `text` holds a user-facing message. */
  error?: string;
}

export async function completeWithProvider(
  config: AIProviderConfig,
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 1000,
): Promise<CompletionResult> {
  if (!config.available || !config.apiKey) {
    return { text: 'No AI provider configured. Add an API key in Settings.', tokensUsed: 0, error: 'no-provider' };
  }

  try {
    if (config.provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });
      const data = await res.json();
      if (!res.ok) return { text: errorText('Anthropic', data), tokensUsed: 0, error: 'http' };
      return {
        text: data?.content?.[0]?.text ?? '',
        tokensUsed: (data?.usage?.input_tokens ?? 0) + (data?.usage?.output_tokens ?? 0),
      };
    }

    if (config.provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({
          model: config.model,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });
      const data = await res.json();
      if (!res.ok) return { text: errorText('OpenAI', data), tokensUsed: 0, error: 'http' };
      return {
        text: data?.choices?.[0]?.message?.content ?? '',
        tokensUsed: (data?.usage?.prompt_tokens ?? 0) + (data?.usage?.completion_tokens ?? 0),
      };
    }

    // gemini
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: { maxOutputTokens: maxTokens },
        }),
      },
    );
    const data = await res.json();
    if (!res.ok) return { text: errorText('Gemini', data), tokensUsed: 0, error: 'http' };
    return {
      text: data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
      tokensUsed:
        (data?.usageMetadata?.promptTokenCount ?? 0) + (data?.usageMetadata?.candidatesTokenCount ?? 0),
    };
  } catch (err) {
    return {
      text: `Could not reach ${PROVIDER_LABEL[config.provider]}: ${err instanceof Error ? err.message : 'network error'}`,
      tokensUsed: 0,
      error: 'network',
    };
  }
}

function errorText(provider: string, data: unknown): string {
  const msg =
    (data as { error?: { message?: string } })?.error?.message ?? 'request failed';
  return `${provider} error: ${msg}`;
}
