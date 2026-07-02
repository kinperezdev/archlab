/**
 * Analysis enrichment — folds live internet data into a finished analysis.
 *
 * After the scanner produces its offline result, this adds outdated-dependency
 * findings, known vulnerabilities (OSV), and stack best-practice tips using the
 * cached fetchers in liveData.ts. Enrichment is additive and optional: if the
 * machine is offline the base analysis is returned untouched.
 */

import {
  loadLiveDataCache,
  saveLiveDataCache,
  isCacheFresh,
  checkNpmVersion,
  checkVulnerabilities,
  searchWeb,
  type NpmPackageInfo,
  type Vulnerability,
} from './liveData.js';

export interface EnrichmentResult {
  outdatedPackages: NpmPackageInfo[];
  vulnerabilities: Vulnerability[];
  securityAdvisories: { package: string; advisory: string; severity: string }[];
  stackBestPractices: { tool: string; tip: string; url: string }[];
  internetConnections: {
    totalConnectedNodes: number;
    externalServices: string[];
    unverifiedFetchCalls: number;
    securityRisks: string[];
  };
  enrichedAt: number;
}

export async function enrichAnalysis(
  dependencies: Record<string, string>,
  _detectedTools: string[],
  techStack: string[],
  onProgress: (message: string) => void,
): Promise<EnrichmentResult> {
  const cache = loadLiveDataCache();
  const result: EnrichmentResult = {
    outdatedPackages: [],
    vulnerabilities: [],
    securityAdvisories: [],
    stackBestPractices: [],
    internetConnections: { totalConnectedNodes: 0, externalServices: [], unverifiedFetchCalls: 0, securityRisks: [] },
    enrichedAt: Date.now(),
  };

  // Check npm versions for top 10 dependencies
  const depsToCheck = Object.entries(dependencies).slice(0, 10);
  for (const [pkg, version] of depsToCheck) {
    const cleanVersion = version.replace(/[\^~]/g, '');
    const cacheKey = `${pkg}@${cleanVersion}`;
    if (cache.npmVersions[cacheKey] && isCacheFresh(cache.npmVersions[cacheKey].fetchedAt)) {
      if (cache.npmVersions[cacheKey].outdated) {
        result.outdatedPackages.push({
          name: pkg,
          installedVersion: version,
          latestVersion: cache.npmVersions[cacheKey].latest,
          isOutdated: true,
          releaseDate: '',
        });
      }
    } else {
      onProgress(`Checking ${pkg} version...`);
      const info = await checkNpmVersion(pkg, cleanVersion);
      cache.npmVersions[cacheKey] = {
        latest: info.latestVersion,
        installed: version,
        outdated: info.isOutdated,
        fetchedAt: Date.now(),
      };
      if (info.isOutdated) result.outdatedPackages.push(info);
      await new Promise((r) => setTimeout(r, 100)); // rate limit
    }
  }

  // Check vulnerabilities for security-sensitive packages
  const securitySensitive = Object.entries(dependencies).filter(([pkg]) =>
    ['express', 'jsonwebtoken', 'axios', 'lodash', 'moment', 'node-fetch', 'got', 'superagent'].includes(pkg),
  );

  for (const [pkg, version] of securitySensitive.slice(0, 5)) {
    const cleanVersion = version.replace(/[\^~]/g, '');
    const cacheKey = `vuln-${pkg}@${cleanVersion}`;
    if (cache.vulnerabilities[cacheKey] && isCacheFresh(cache.vulnerabilities[cacheKey][0]?.publishedDate ? Date.now() - 1000 : 0)) {
      result.vulnerabilities.push(...cache.vulnerabilities[cacheKey]);
    } else {
      onProgress(`Checking ${pkg} for vulnerabilities...`);
      const vulns = await checkVulnerabilities(pkg, cleanVersion);
      cache.vulnerabilities[cacheKey] = vulns;
      result.vulnerabilities.push(...vulns);
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // Get stack best practices via web search
  if (techStack.length > 0) {
    const stackQuery = `${techStack.slice(0, 3).join(' + ')} security best practices 2025`;
    const cacheKey = `search-${stackQuery}`;
    if (!cache.searchResults[cacheKey] || !isCacheFresh(cache.searchResults[cacheKey].fetchedAt)) {
      onProgress(`Searching best practices for ${techStack.slice(0, 2).join(' + ')}...`);
      const searchRes = await searchWeb(stackQuery);
      cache.searchResults[cacheKey] = { results: searchRes, fetchedAt: Date.now() };
    }

    const searchResults = cache.searchResults[cacheKey]?.results || [];
    result.stackBestPractices = searchResults.slice(0, 3).map((r) => ({
      tool: techStack[0] || 'general',
      tip: r.snippet,
      url: r.url,
    }));
  }

  saveLiveDataCache(cache);
  return result;
}
