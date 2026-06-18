/**
 * Heuristic checks for the security, performance, and scale pipeline steps.
 *
 * These are real (if best-effort) scans over the project's source. Each finding
 * is shaped as a teaching Diagnostic: what / why / how-to-fix / optimization.
 */

import crypto from 'node:crypto';
import type { CanvasNode, Diagnostic, PipelineStepId, Severity } from '@archlab/shared';
import type { AnalysisResult } from '../analyzer/analyzer.js';
import { detectFrameworks, type TechProfile } from '../analyzer/frameworks.js';

/** Small helper to build a diagnostic with a stable-ish unique id. */
function diag(
  step: PipelineStepId,
  severity: Severity,
  title: string,
  what: string,
  why: string,
  howToFix: string,
  optimization: string,
  relatedNodeIds: string[] = [],
): Diagnostic {
  return {
    id: crypto.randomUUID(),
    step,
    severity,
    title,
    what,
    why,
    howToFix,
    optimization,
    relatedNodeIds,
  };
}

/** Find node ids whose file path matches a predicate, for highlighting. */
function nodesFor(analysis: AnalysisResult, relPath: string): string[] {
  return analysis.canvas.nodes.filter((n) => n.filePath === relPath).map((n) => n.id);
}

/** Helper to parse useEffect and verify if it has a dependency array, avoiding nested callback false positives. */
function hasEffectWithoutDeps(content: string): boolean {
  let idx = 0;
  while (true) {
    idx = content.indexOf('useEffect(', idx);
    if (idx === -1) break;
    
    const postUseEffect = content.substring(idx + 10);
    const callbackMatch = /^\s*(?:async\s*)?\(\s*\)\s*=>\s*\{/.exec(postUseEffect);
    if (callbackMatch) {
      const startBraceIdx = idx + 10 + callbackMatch.index + callbackMatch[0].length - 1;
      let braceCount = 1;
      let scanIdx = startBraceIdx + 1;
      while (scanIdx < content.length && braceCount > 0) {
        if (content[scanIdx] === '{') braceCount++;
        else if (content[scanIdx] === '}') braceCount--;
        scanIdx++;
      }
      
      if (braceCount === 0) {
        const postCallback = content.substring(scanIdx);
        const nextCharMatch = /^\s*\)/.test(postCallback);
        if (nextCharMatch) {
          return true;
        }
      }
    }
    idx += 10;
  }
  return false;
}

/** SECURITY — step 4. */
export function securityChecks(analysis: AnalysisResult): Diagnostic[] {
  const out: Diagnostic[] = [];
  const { scan } = analysis;
  const fw = detectFrameworks(scan);

  // Exposed secrets: a committed .env with assigned values.
  const envFile = scan.files.find((f) => /(^|\/)\.env($|\.)/.test(f.relPath));
  if (envFile && /\w+\s*=\s*\S+/.test(envFile.content)) {
    out.push(
      diag(
        'security-checks',
        'critical',
        'Exposed secrets in committed .env',
        `A populated environment file (${envFile.relPath}) was found in the project.`,
        'Committed secrets leak credentials to anyone with repo access and are nearly impossible to fully revoke once pushed.',
        'Move secrets to an untracked .env, add it to .gitignore, provide a .env.example with empty keys, and rotate any exposed values.',
        'Adopt a secret manager or your platform env settings so secrets never touch disk in plaintext.',
        nodesFor(analysis, envFile.relPath),
      ),
    );
  }

  // Missing CORS configuration when a backend exists (Express-specific guidance).
  const hasBackend = analysis.canvas.nodes.some((n) => n.lane === 'backend');
  const mentionsCors = scan.files.some((f) => /\bcors\b|Access-Control-Allow-Origin/i.test(f.content));
  if (fw.isExpress && hasBackend && !mentionsCors) {
    out.push(
      diag(
        'security-checks',
        'high',
        'No CORS configuration detected',
        'No CORS setup was found anywhere in the backend.',
        'Without an explicit CORS policy, cross-origin access is either fully blocked or implicitly broad depending on defaults, both of which cause real bugs or exposure.',
        'Add a CORS middleware with an explicit allowlist of trusted origins and only the methods/headers you need.',
        'Drive the allowlist from config so staging and production can differ without code changes.',
      ),
    );
  }
  
  // Possible SQL injection via string concatenation in queries.
  for (const f of scan.files) {
    const isBackend = !f.relPath.includes('frontend') && !f.relPath.includes('checks.ts') && (f.relPath.includes('backend') || f.relPath.includes('server') || f.relPath.includes('database'));
    const isSqlConcat = /'[^']*?\b(select|insert|update|delete|drop)\b[^']*?'\s*\+|"[^"]*?\b(select|insert|update|delete|drop)\b[^"]*?"\s*\+/i;
    const isSqlTemplate = /`[^`]*?\b(select|insert|update|delete|drop)\b[^`]*?\$\{/i;
    if (isBackend && (isSqlConcat.test(f.content) || isSqlTemplate.test(f.content))) {
      out.push(
        diag(
          'security-checks',
          'critical',
          'Possible SQL injection',
          `Query strings appear to be built with concatenation/interpolation in ${f.relPath}.`,
          'Interpolating user input directly into SQL lets an attacker alter the query and read or destroy data.',
          'Use parameterized queries / prepared statements and pass values as bound parameters, never string-built SQL.',
          'Introduce a query builder or ORM that parameterizes by default to remove this whole class of bug.',
          nodesFor(analysis, f.relPath),
        ),
      );
      break; // One representative finding is enough for the demo.
    }
  }

  // Missing rate limiting (Express-specific guidance).
  const mentionsRateLimit = scan.files.some((f) => /rate.?limit|express-rate-limit/i.test(f.content));
  if (fw.isExpress && hasBackend && !mentionsRateLimit) {
    out.push(
      diag(
        'security-checks',
        'medium',
        'No rate limiting detected',
        'No rate-limiting middleware was found on the backend.',
        'Unthrottled endpoints are vulnerable to brute-force and denial-of-service abuse.',
        'Add a rate limiter on auth and write endpoints with sane per-IP windows.',
        'Pair rate limiting with exponential backoff and lightweight anti-abuse (honeypots) before reaching for CAPTCHAs.',
      ),
    );
  }

  out.push(...frameworkSecurityChecks(analysis, fw));

  return out;
}

/** Framework-specific security checks (Django, Spring, Go, Laravel). */
function frameworkSecurityChecks(analysis: AnalysisResult, fw: TechProfile): Diagnostic[] {
  const out: Diagnostic[] = [];
  const { scan } = analysis;
  const has = (re: RegExp) => scan.files.some((f) => f.content && re.test(f.content));

  // --- Django ---
  if (fw.isDjango) {
    if (!has(/ALLOWED_HOSTS/)) {
      out.push(
        diag(
          'security-checks',
          'high',
          'Django ALLOWED_HOSTS not configured',
          'No ALLOWED_HOSTS setting was found in the Django settings.',
          'An empty or wildcard ALLOWED_HOSTS lets attackers spoof the Host header (cache poisoning, password-reset poisoning).',
          'Set ALLOWED_HOSTS to your explicit production domains in settings.py and drive it from environment config.',
          'Split settings into base/dev/prod modules so production never falls back to permissive defaults.',
        ),
      );
    }
    if (!has(/CSRF_COOKIE_SECURE\s*=\s*True/)) {
      out.push(
        diag(
          'security-checks',
          'medium',
          'Django CSRF_COOKIE_SECURE not enabled',
          'CSRF_COOKIE_SECURE was not found set to True.',
          'Without it the CSRF cookie can be sent over plain HTTP and intercepted on the network.',
          'Set CSRF_COOKIE_SECURE = True (and SESSION_COOKIE_SECURE = True) in production settings.',
          'Also enable SECURE_SSL_REDIRECT and HSTS so all traffic is forced onto HTTPS.',
        ),
      );
    }
  }

  // --- Spring ---
  if (fw.isSpring) {
    if (!has(/@CrossOrigin|CorsConfiguration|addCorsMappings/)) {
      out.push(
        diag(
          'security-checks',
          'high',
          'No CORS configuration detected (Spring)',
          'No @CrossOrigin or CORS configuration bean was found.',
          'Without an explicit CORS policy, cross-origin browser calls are either blocked or implicitly broad depending on defaults.',
          'Add a CorsConfigurationSource bean (or @CrossOrigin) with an explicit allowlist of origins, methods, and headers.',
          'Centralize the allowlist in configuration so environments differ without code changes.',
        ),
      );
    }
    if (!has(/spring-security|SecurityFilterChain|@EnableWebSecurity/)) {
      out.push(
        diag(
          'security-checks',
          'high',
          'No Spring Security detected',
          'No Spring Security configuration was found on this Spring application.',
          'Without Spring Security, endpoints have no authentication or authorization enforcement layer.',
          'Add spring-boot-starter-security and define a SecurityFilterChain that authenticates requests and protects routes.',
          'Use method-level @PreAuthorize for fine-grained authorization on sensitive operations.',
        ),
      );
    }
  }

  // --- Go ---
  if (fw.isGo) {
    if (!has(/\.Use\(|middleware|negroni|alice\./)) {
      out.push(
        diag(
          'security-checks',
          'medium',
          'No middleware chain detected (Go)',
          'No router middleware chain was found in the Go service.',
          'Cross-cutting concerns (auth, logging, recovery, CORS) belong in middleware; their absence usually means they are missing or scattered.',
          'Introduce a middleware chain on your router (e.g. chi/gin Use, or negroni/alice) for auth, recovery, and request logging.',
          'Add a panic-recovery middleware so a single handler panic cannot take down the process.',
        ),
      );
    }
    if (!has(/context\.WithTimeout|context\.WithDeadline|ctx,\s*cancel/)) {
      out.push(
        diag(
          'security-checks',
          'medium',
          'No request context timeout detected (Go)',
          'No context.WithTimeout / WithDeadline usage was found around outbound calls.',
          'Without timeouts, a slow downstream dependency can exhaust goroutines and connections until the service stalls.',
          'Wrap database and HTTP calls in context.WithTimeout and propagate the request context end to end.',
          'Add an http.Server with ReadTimeout/WriteTimeout/IdleTimeout set so slow clients cannot pin resources.',
        ),
      );
    }
  }

  // --- Laravel ---
  if (fw.isLaravel) {
    if (!has(/VerifyCsrfToken|@csrf|csrf_field/)) {
      out.push(
        diag(
          'security-checks',
          'high',
          'No CSRF protection detected (Laravel)',
          'The VerifyCsrfToken middleware / @csrf directive was not found.',
          'State-changing form posts without CSRF tokens are vulnerable to cross-site request forgery.',
          'Ensure the VerifyCsrfToken middleware is in the web group and add @csrf to every form.',
          'For SPA/API token flows, use Sanctum and keep CSRF protection on the stateful web routes.',
        ),
      );
    }
    if (!has(/throttle:|ThrottleRequests|RateLimiter::/)) {
      out.push(
        diag(
          'security-checks',
          'medium',
          'No rate limiting middleware detected (Laravel)',
          'No throttle middleware or RateLimiter definition was found.',
          'Unthrottled routes are open to brute-force and denial-of-service abuse.',
          "Apply the 'throttle' middleware to auth and API routes and define named limiters in RouteServiceProvider.",
          'Tune per-route limits and return 429 with Retry-After so clients back off correctly.',
        ),
      );
    }
  }

  return out;
}

/** PERFORMANCE — step 5. */
export function performanceChecks(analysis: AnalysisResult): Diagnostic[] {
  const out: Diagnostic[] = [];
  const { scan } = analysis;
  const fw = detectFrameworks(scan);

  // SELECT * usage.
  const selectStar = scan.files.find((f) => /select\s+\*/i.test(f.content));
  if (selectStar) {
    out.push(
      diag(
        'performance-checks',
        'medium',
        'SELECT * query',
        `A "SELECT *" query was found in ${selectStar.relPath}.`,
        'Selecting every column ships unneeded data over the wire and prevents covering-index optimizations.',
        'Select only the columns you use and add indexes that cover the query.',
        'Profile the slowest queries and add composite indexes matched to real access patterns.',
        nodesFor(analysis, selectStar.relPath),
      ),
    );
  }

  // React effect without a dependency array (re-render / leak risk). React-only.
  const effectNoDeps = fw.isReact ? scan.files.find((f) => hasEffectWithoutDeps(f.content)) : undefined;
  if (effectNoDeps) {
    out.push(
      diag(
        'performance-checks',
        'medium',
        'useEffect without dependency array',
        `A useEffect with no dependency array was found in ${effectNoDeps.relPath}.`,
        'It runs after every render, causing unnecessary work and potential memory leaks from un-cleaned subscriptions.',
        'Add a dependency array and return a cleanup function for any subscriptions or timers.',
        'Memoize expensive children and derived values so re-renders stay cheap.',
        nodesFor(analysis, effectNoDeps.relPath),
      ),
    );
  }

  // No caching anywhere.
  const mentionsCache = scan.files.some((f) => /cache|redis|memo|swr|react-query|tanstack/i.test(f.content));
  if (!mentionsCache) {
    out.push(
      diag(
        'performance-checks',
        'low',
        'No caching strategy detected',
        'No caching layer or data-cache library was found.',
        'Recomputing or re-fetching the same data inflates latency and load.',
        'Add stale-while-revalidate client caching (React Query/SWR) and a server cache for hot reads.',
        'Cache at the edge for static and semi-static responses to cut origin traffic.',
      ),
    );
  }

  return out;
}

/** SCALE — step 6. */
export function scaleChecks(analysis: AnalysisResult): Diagnostic[] {
  const out: Diagnostic[] = [];
  const nodes = analysis.canvas.nodes;

  const dbNodes = nodes.filter((n) => n.kind === 'database');
  if (dbNodes.length === 1) {
    out.push(
      diag(
        'scale-analysis',
        'high',
        'Single database — single point of failure',
        'The system depends on one database node with no replication detected.',
        'A single database is both a throughput ceiling and a single point of failure under load.',
        'Add read replicas, connection pooling, and a failover strategy.',
        'Introduce caching and consider sharding or partitioning hot tables as volume grows.',
        dbNodes.map((n) => n.id),
      ),
    );
  }

  // Stateful session handling hurts horizontal scaling.
  const inMemorySession = analysis.scan.files.some((f) =>
    /express-session(?![\s\S]*store)|new Map\(\)[\s\S]*session/i.test(f.content),
  );
  if (inMemorySession) {
    out.push(
      diag(
        'scale-analysis',
        'high',
        'Stateful in-memory sessions',
        'Sessions appear to be stored in process memory.',
        'In-memory state cannot be shared across instances, so horizontal scaling breaks user sessions.',
        'Move sessions to a shared store (Redis) or use stateless signed tokens.',
        'Make every service stateless so instances are freely replaceable behind a load balancer.',
      ),
    );
  }

  // Check if data is stored locally (offline storage) vs remote cloud databases.
  const hasLocalPersistence = analysis.scan.files.some((f) =>
    /sqlite|sqlite3|hive|isar|shared_preferences|sharedpreferences|localstorage|indexeddb|floor\b|sembast/i.test(f.content + f.relPath)
  );

  const dbFileNames = dbNodes.map((n) => n.label.toLowerCase()).join(' ');
  const dbHasLocalNames = /sqlite|hive|isar|local|sembast/i.test(dbFileNames);

  if (hasLocalPersistence || dbHasLocalNames) {
    out.push(
      diag(
        'scale-analysis',
        'info',
        'Local / Offline persistence detected',
        'The project uses local storage or an embedded database (e.g. SQLite, Hive, Isar, LocalStorage).',
        'Local persistence is excellent for offline-first user experience, low latency, and native application performance.',
        'Ensure proper synchronization strategies are in place to sync local records with cloud state when connectivity returns.',
        'Implement robust local migrations so schema updates do not brick existing user databases on upgrade.',
        dbNodes.map((n) => n.id)
      ),
    );
  } else if (dbNodes.length > 0) {
    out.push(
      diag(
        'scale-analysis',
        'medium',
        'Strictly cloud/online database (No local cache)',
        'The project connects to remote database servers but does not have local/offline sync patterns.',
        'Without local replication or offline caching, users will experience loading freezes or connection dropouts if network connectivity degrades.',
        'Implement SQLite, Hive, or Isar caching wrappers on the client to store UI data locally for offline reads.',
        'Use sync engines or repositories that serve cached data first, updating asynchronously from backend APIs.',
        dbNodes.map((n) => n.id)
      ),
    );
  }

  return out;
}

/** Tally diagnostics by severity for the report header. */
export function countSeverities(diagnostics: Diagnostic[]): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    critical: 0,
    high: 0,
    bottleneck: 0,
    medium: 0,
    low: 0,
    info: 0,
  };
  for (const d of diagnostics) counts[d.severity] += 1;
  return counts;
}

export type { CanvasNode };
