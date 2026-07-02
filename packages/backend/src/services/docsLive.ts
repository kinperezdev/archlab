/**
 * Docs live updates — keeps the Docs tab current with the outside world.
 *
 * Pulls latest version / end-of-life data for the technologies the docs
 * articles teach, from endoflife.date (free, no API key). Cached on disk in
 * the brain, refreshed automatically every 24 hours and on demand. Fetch
 * failures never wipe the cache: each tech keeps its last good data.
 */

import path from 'path';
import fs from 'fs';
import { BRAIN_DIR } from '../brain/paths.js';
import { fetchUrl } from './liveData.js';

export interface DocsLiveTech {
  /** endoflife.date product slug. */
  id: string;
  /** Display name in the Docs panel. */
  label: string;
  /** Latest stable version of the newest release cycle. */
  latestVersion: string;
  /** ISO date the latest version shipped. */
  latestReleaseDate: string;
  /** Newest release cycle name (e.g. "22" for Node 22). */
  cycle: string;
  /** True when the newest cycle has already reached end of life. */
  isEol: boolean;
  /** ISO date the newest cycle reaches end of life, if published. */
  eolDate: string | null;
  /** Whether the newest cycle is an LTS line. */
  lts: boolean;
  /** Link to the product's endoflife.date page for full detail. */
  url: string;
  fetchedAt: number;
}

export interface DocsLiveData {
  items: DocsLiveTech[];
  fetchedAt: number;
}

/** Technologies covered by the Docs articles, keyed by endoflife.date slug. */
const TRACKED_TECH: Array<{ id: string; label: string }> = [
  { id: 'nodejs', label: 'Node.js' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'react', label: 'React' },
  { id: 'postgresql', label: 'PostgreSQL' },
  { id: 'redis', label: 'Redis' },
  { id: 'mongodb', label: 'MongoDB' },
  { id: 'python', label: 'Python' },
  { id: 'django', label: 'Django' },
  { id: 'go', label: 'Go' },
  { id: 'nginx', label: 'nginx' },
  { id: 'kubernetes', label: 'Kubernetes' },
];

const CACHE_FILE = path.join(BRAIN_DIR, 'docs-live.json');
const TTL_MS = 24 * 60 * 60 * 1000; // refresh daily

export function loadDocsLive(): DocsLiveData {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      if (Array.isArray(data?.items)) return data as DocsLiveData;
    }
  } catch {
    /* fall through to empty */
  }
  return { items: [], fetchedAt: 0 };
}

function saveDocsLive(data: DocsLiveData): void {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[docs-live] failed to persist cache:', err);
  }
}

export function isDocsLiveFresh(data: DocsLiveData): boolean {
  return Date.now() - data.fetchedAt < TTL_MS;
}

/** Fetch the newest release cycle for one product from endoflife.date. */
async function fetchTech(id: string, label: string): Promise<DocsLiveTech | null> {
  try {
    const raw = await fetchUrl(`https://endoflife.date/api/${encodeURIComponent(id)}.json`, 8000);
    const cycles = JSON.parse(raw);
    if (!Array.isArray(cycles) || cycles.length === 0) return null;
    const newest = cycles[0];
    // `eol` is either a date string or boolean false (no EOL announced).
    const eolRaw = newest.eol;
    const isEol = typeof eolRaw === 'string' ? new Date(eolRaw).getTime() < Date.now() : eolRaw === true;
    return {
      id,
      label,
      latestVersion: String(newest.latest ?? newest.cycle ?? ''),
      latestReleaseDate: String(newest.latestReleaseDate ?? newest.releaseDate ?? ''),
      cycle: String(newest.cycle ?? ''),
      isEol,
      eolDate: typeof eolRaw === 'string' ? eolRaw : null,
      lts: Boolean(newest.lts),
      url: `https://endoflife.date/${id}`,
      fetchedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

/**
 * Refresh every tracked tech in parallel. Techs that fail keep their previous
 * cached entry so a flaky network never blanks the panel.
 */
export async function refreshDocsLive(): Promise<DocsLiveData> {
  const previous = new Map(loadDocsLive().items.map((t) => [t.id, t]));
  const results = await Promise.all(TRACKED_TECH.map((t) => fetchTech(t.id, t.label)));

  const items: DocsLiveTech[] = [];
  TRACKED_TECH.forEach((tech, i) => {
    const fresh = results[i];
    const fallback = previous.get(tech.id);
    if (fresh) items.push(fresh);
    else if (fallback) items.push(fallback);
  });

  const data: DocsLiveData = { items, fetchedAt: Date.now() };
  // Only persist if at least one fetch succeeded; otherwise keep the old cache.
  if (results.some((r) => r !== null)) saveDocsLive(data);
  return data;
}

/** Kick off the daily background refresh loop. Timers never hold the process open. */
export function startDocsLiveScheduler(): void {
  const initial = setTimeout(() => {
    if (!isDocsLiveFresh(loadDocsLive())) {
      void refreshDocsLive().catch(() => {});
    }
  }, 10_000); // let the server finish booting first
  initial.unref();

  const daily = setInterval(() => {
    void refreshDocsLive().catch(() => {});
  }, TTL_MS);
  daily.unref();
}
