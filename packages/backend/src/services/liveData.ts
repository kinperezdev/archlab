/**
 * Live data fetchers — the only place the backend talks to the internet.
 *
 * Free, keyless sources only: npm registry (latest versions), OSV (known
 * vulnerabilities), DuckDuckGo instant answers (best-practice lookups). All
 * results are cached in brain/live-data-cache.json with a 24h TTL, and every
 * fetcher fails soft (returns empty) so offline use never breaks analysis.
 */

import https from 'https';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { BRAIN_DIR } from '../brain/paths.js';

export interface LiveDataCache {
  npmVersions: Record<string, { latest: string; installed: string; outdated: boolean; fetchedAt: number }>;
  vulnerabilities: Record<string, Vulnerability[]>;
  stackDocs: Record<string, { url: string; summary: string; fetchedAt: number }>;
  searchResults: Record<string, { results: SearchResult[]; fetchedAt: number }>;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export interface NpmPackageInfo {
  name: string;
  installedVersion: string;
  latestVersion: string;
  isOutdated: boolean;
  releaseDate: string;
  changelog?: string;
}

export interface Vulnerability {
  id: string;
  package: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  summary: string;
  details: string;
  affectedVersions: string;
  fixedVersion?: string;
  cvssScore?: number;
  publishedDate: string;
  referenceUrl: string;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const BRAIN_LIVE_DATA_PATH = path.join(BRAIN_DIR, 'live-data-cache.json');

// Simple HTTP fetch utility (no external dependencies)
export async function fetchUrl(url: string, timeoutMs = 5000): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });
  });
}

// Check npm registry for latest version
export async function checkNpmVersion(packageName: string, installedVersion: string): Promise<NpmPackageInfo> {
  try {
    const data = await fetchUrl(`https://registry.npmjs.org/${encodeURIComponent(packageName)}/latest`);
    const pkg = JSON.parse(data);
    const latestVersion = pkg.version;
    const isOutdated = installedVersion !== latestVersion && installedVersion !== `^${latestVersion}`;
    return {
      name: packageName,
      installedVersion,
      latestVersion,
      isOutdated,
      releaseDate: pkg.time || pkg._time || '',
      changelog: pkg.homepage || `https://www.npmjs.com/package/${packageName}`,
    };
  } catch {
    return { name: packageName, installedVersion, latestVersion: installedVersion, isOutdated: false, releaseDate: '' };
  }
}

// Check OSV database for vulnerabilities (free, no API key)
export async function checkVulnerabilities(packageName: string, version: string, ecosystem: string = 'npm'): Promise<Vulnerability[]> {
  try {
    const body = JSON.stringify({
      package: { name: packageName, ecosystem },
      version,
    });
    return new Promise((resolve) => {
      const req = https.request(
        {
          hostname: 'api.osv.dev',
          path: '/v1/query',
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': body.length },
          timeout: 5000,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              const result = JSON.parse(data);
              const vulns: Vulnerability[] = (result.vulns || []).map((v: any) => ({
                id: v.id,
                package: packageName,
                severity: v.database_specific?.severity || 'MEDIUM',
                summary: v.summary || '',
                details: v.details || '',
                affectedVersions: v.affected?.[0]?.versions?.join(', ') || '',
                fixedVersion: v.affected?.[0]?.ranges?.[0]?.events?.find((e: any) => e.fixed)?.fixed,
                cvssScore: v.severity?.[0]?.score,
                publishedDate: v.published || '',
                referenceUrl: v.references?.[0]?.url || `https://osv.dev/vulnerability/${v.id}`,
              }));
              resolve(vulns);
            } catch {
              resolve([]);
            }
          });
        },
      );
      req.on('error', () => resolve([]));
      req.on('timeout', () => {
        req.destroy();
        resolve([]);
      });
      req.write(body);
      req.end();
    });
  } catch {
    return [];
  }
}

// Fetch documentation summary for a tech stack item
export async function fetchStackDocSummary(_toolId: string, docsUrl: string): Promise<string> {
  try {
    const html = await fetchUrl(docsUrl, 8000);
    // Extract text content from HTML — simple regex approach
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500); // First 500 chars as summary
    return text;
  } catch {
    return '';
  }
}

// Search using DuckDuckGo instant answers (free, no API key)
export async function searchWeb(query: string): Promise<SearchResult[]> {
  try {
    const encoded = encodeURIComponent(query);
    const data = await fetchUrl(`https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`, 8000);
    const result = JSON.parse(data);
    const results: SearchResult[] = [];

    if (result.AbstractText) {
      results.push({
        title: result.Heading || query,
        url: result.AbstractURL || '',
        snippet: result.AbstractText.slice(0, 300),
      });
    }

    if (result.RelatedTopics) {
      for (const topic of result.RelatedTopics.slice(0, 4)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.slice(0, 60),
            url: topic.FirstURL,
            snippet: topic.Text.slice(0, 200),
          });
        }
      }
    }

    return results;
  } catch {
    return [];
  }
}

// Load cache from brain
export function loadLiveDataCache(): LiveDataCache {
  try {
    if (fs.existsSync(BRAIN_LIVE_DATA_PATH)) {
      return JSON.parse(fs.readFileSync(BRAIN_LIVE_DATA_PATH, 'utf-8'));
    }
  } catch {}
  return { npmVersions: {}, vulnerabilities: {}, stackDocs: {}, searchResults: {} };
}

// Save cache to brain
export function saveLiveDataCache(cache: LiveDataCache): void {
  try {
    fs.mkdirSync(path.dirname(BRAIN_LIVE_DATA_PATH), { recursive: true });
    fs.writeFileSync(BRAIN_LIVE_DATA_PATH, JSON.stringify(cache, null, 2));
  } catch {}
}

// Check if cache entry is fresh
export function isCacheFresh(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < CACHE_TTL_MS;
}
