/**
 * Session auth bootstrap.
 *
 * The backend issues a per-run secret token. We fetch it once at startup, then
 * patch the global `fetch` so every call to the backend automatically carries
 * the token header — no need to thread it through dozens of call sites. The WS
 * layer reads the same token via `getSessionToken()` to append `?token=`.
 */

import { PORTS } from '@archlab/shared';

const BACKEND_ORIGIN = `http://127.0.0.1:${PORTS.backend}`;
const TOKEN_HEADER = 'X-ArchLab-Token';

let sessionToken = '';

/** The current session token (empty until {@link initSession} resolves). */
export function getSessionToken(): string {
  return sessionToken;
}

/** True when a request URL targets the ArchLab backend (so it needs the token). */
function isBackendUrl(url: string): boolean {
  return url.startsWith(BACKEND_ORIGIN) || url.startsWith(`http://localhost:${PORTS.backend}`);
}

/**
 * Fetch the token and install the fetch wrapper. Must run before the app makes
 * any backend call. Safe to call once; failures leave fetch untouched so the
 * UI still renders (and backend calls will surface 401s the user can see).
 */
export async function initSession(): Promise<void> {
  try {
    const res = await fetch(`${BACKEND_ORIGIN}/session/token`);
    const data = await res.json();
    if (data?.ok && typeof data.token === 'string') {
      sessionToken = data.token;
    }
  } catch (err) {
    console.error('[session] could not obtain session token:', err);
  }

  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (sessionToken && isBackendUrl(url)) {
      const headers = new Headers(init.headers ?? (input instanceof Request ? input.headers : undefined));
      headers.set(TOKEN_HEADER, sessionToken);
      return nativeFetch(input, { ...init, headers });
    }
    return nativeFetch(input, init);
  };
}
