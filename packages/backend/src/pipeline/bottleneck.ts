/**
 * Bottleneck detector.
 *
 * Finds architectural and scale bottlenecks from the analyzed canvas + scanned
 * source. Each is shaped as a `bottleneck`-severity Diagnostic (amber), distinct
 * from red critical security findings, and carries a concrete scale threshold
 * estimate plus an architectural fix. Runs inside the pipeline and standalone.
 */

import crypto from 'node:crypto';
import type { CanvasEdge, CanvasNode, Diagnostic } from '@archlab/shared';
import type { AnalysisResult } from '../analyzer/analyzer.js';

interface BottleneckSpec {
  type: string;
  title: string;
  what: string;
  why: string;
  howToFix: string;
  optimization: string;
  userThreshold: string;
  relatedNodeIds: string[];
}

function toDiagnostic(spec: BottleneckSpec): Diagnostic {
  return {
    id: crypto.randomUUID(),
    step: 'scale-analysis',
    severity: 'bottleneck',
    title: spec.title,
    what: spec.what,
    why: spec.why,
    howToFix: spec.howToFix,
    optimization: spec.optimization,
    relatedNodeIds: spec.relatedNodeIds,
    bottleneckType: spec.type,
    userThreshold: spec.userThreshold,
  };
}

/** Count direct dependents (in-degree) for every node. */
function inDegree(edges: CanvasEdge[]): Map<string, number> {
  const d = new Map<string, number>();
  for (const e of edges) d.set(e.target, (d.get(e.target) ?? 0) + 1);
  return d;
}

/** Source content for a node's file, for code-signal checks. */
function contentFor(analysis: AnalysisResult, node: CanvasNode): string {
  if (!node.filePath) return '';
  return analysis.scan.files.find((f) => f.relPath === node.filePath)?.content ?? '';
}

/** Detect all bottlenecks. Pure: derives entirely from the analysis in memory. */
export function detectBottlenecks(analysis: AnalysisResult): Diagnostic[] {
  const out: Diagnostic[] = [];
  const { nodes, edges } = analysis.canvas;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const indeg = inDegree(edges);
  const hasCaching = analysis.scan.files.some((f) =>
    /cache|redis|memo|swr|react-query|tanstack|lru/i.test(f.content),
  );

  // 1. SINGLE POINT OF FAILURE — 3+ nodes depend directly on this node.
  for (const node of nodes) {
    const dependents = indeg.get(node.id) ?? 0;
    if (dependents >= 3) {
      out.push(
        toDiagnostic({
          type: 'SINGLE POINT OF FAILURE',
          title: `Single point of failure: ${node.label}`,
          what: `${dependents} other nodes depend directly on "${node.label}". If it goes down it takes all of them with it.`,
          why: 'A node with many direct dependents concentrates risk: one failure cascades across every consumer.',
          howToFix:
            'Decouple consumers behind an interface, add redundancy/failover for this node, and introduce graceful degradation so dependents survive its outage.',
          optimization:
            'Add circuit breakers and health checks around it so failures are contained instead of cascading.',
          userThreshold: `with ${dependents} dependents, an outage here is an immediate full-system incident at any scale`,
          relatedNodeIds: [node.id],
        }),
      );
    }
  }

  // 2. DB HOTSPOT — a database node accessed by 5+ backend nodes.
  for (const node of nodes) {
    if (node.kind !== 'database') continue;
    const backendAccessors = edges.filter((e) => {
      if (e.target !== node.id && e.source !== node.id) return false;
      const otherId = e.target === node.id ? e.source : e.target;
      return byId.get(otherId)?.lane === 'backend';
    });
    if (backendAccessors.length >= 5) {
      out.push(
        toDiagnostic({
          type: 'DB HOTSPOT',
          title: `Database hotspot: ${node.label}`,
          what: `${backendAccessors.length} backend nodes read or write "${node.label}". It will become a query bottleneck under load.`,
          why: 'A single hot table serializes contention and becomes the throughput ceiling for everything that touches it.',
          howToFix:
            'Add a read cache (Redis) in front of hot reads, introduce read replicas, and add indexes matched to the actual access patterns.',
          optimization:
            'Partition or shard the hottest table and move heavy aggregations to a denormalized read model.',
          userThreshold: 'this typically starts degrading around 1,000 concurrent users',
          relatedNodeIds: [node.id],
        }),
      );
    }
  }

  // 3. CHOKE POINT — middleware every request passes through, no caching.
  for (const node of nodes) {
    if (node.kind !== 'middleware') continue;
    if (!hasCaching) {
      out.push(
        toDiagnostic({
          type: 'CHOKE POINT',
          title: `Middleware choke point: ${node.label}`,
          what: `Every request passes through "${node.label}" and no caching layer was detected. Each request pays this cost.`,
          why: 'Uncached middleware on the hot path multiplies its per-request cost by total traffic.',
          howToFix:
            'Add a cache in front of expensive middleware work, short-circuit early for cache hits, and make the middleware itself non-blocking.',
          optimization:
            'Move static decisions (auth public routes, CORS preflight) out of the per-request path entirely.',
          userThreshold: 'this becomes a measurable latency tax around 500 concurrent users',
          relatedNodeIds: [node.id],
        }),
      );
    }
  }

  // 4. FRAGILE CONNECTION — websocket node with no queue/retry/error handling.
  for (const node of nodes) {
    const text = `${node.label} ${contentFor(analysis, node)}`;
    const isWs = /websocket|\bws\b|socket\.io|socket/i.test(text);
    if (!isWs) continue;
    const guarded = /queue|retry|reconnect|onerror|on\(['"]error|try\s*\{|catch\s*\(/i.test(text);
    if (!guarded) {
      out.push(
        toDiagnostic({
          type: 'FRAGILE CONNECTION',
          title: `Fragile WebSocket: ${node.label}`,
          what: `"${node.label}" is a WebSocket connection with no queue, retry, or error handling detected. Dropped connections lose data permanently.`,
          why: 'Without buffering or retry, any disconnect drops in-flight messages with no recovery.',
          howToFix:
            'Add an outbound queue with retry/backoff, reconnect logic, and an error handler that persists undelivered messages.',
          optimization:
            'Move to an acknowledged delivery protocol and persist a replay log so clients can resync after a drop.',
          userThreshold: 'data loss risk appears the moment network conditions degrade, regardless of user count',
          relatedNodeIds: [node.id],
        }),
      );
    }
  }

  // 5. RENDER BOTTLENECK — component reading global state with no memoization.
  for (const node of nodes) {
    if (node.kind !== 'component') continue;
    const content = contentFor(analysis, node);
    if (!content) continue;
    const readsGlobalState =
      /useSelector|useStore|useContext|useAppState|zustand|jotai|recoil|connect\(/.test(content);
    const memoized = /React\.memo|\bmemo\(|useMemo|useCallback/.test(content);
    if (readsGlobalState && !memoized) {
      out.push(
        toDiagnostic({
          type: 'RENDER BOTTLENECK',
          title: `Heavy re-render: ${node.label}`,
          what: `"${node.label}" reads global state directly with no memoization detected. It re-renders on every state change.`,
          why: 'Unmemoized global-state consumers re-render on unrelated updates, wasting main-thread time.',
          howToFix:
            'Select only the slice of state you use, wrap the component in React.memo, and memoize derived values and callbacks.',
          optimization:
            'Split the component so frequently-changing state lives in small leaf nodes, keeping the heavy subtree stable.',
          userThreshold: 'visible jank tends to appear once the view renders 60+ times/second under interaction',
          relatedNodeIds: [node.id],
        }),
      );
    }
  }

  // 6. BLOCKING OPERATION — backend doing fs/network/db with no async handling.
  for (const node of nodes) {
    if (node.lane !== 'backend') continue;
    const content = contentFor(analysis, node);
    if (!content) continue;
    const doesIO =
      /readFileSync|writeFileSync|execSync|\.query\(|fetch\(|axios|https?\.get|db\./.test(content);
    const isAsync = /async\s|await\s|\.then\(|Promise\./.test(content);
    if (doesIO && !isAsync) {
      out.push(
        toDiagnostic({
          type: 'BLOCKING OPERATION',
          title: `Blocking operation: ${node.label}`,
          what: `"${node.label}" performs I/O (file system, network, or database) without async/await or promises. This blocks the event loop.`,
          why: 'Synchronous I/O on the request path freezes the entire thread, stalling all concurrent requests.',
          howToFix:
            'Convert the I/O to async/await (use the promise-based fs/db APIs) and never use *Sync calls on the request path.',
          optimization:
            'Offload genuinely CPU-bound work to a worker thread or queue so the event loop stays free.',
          userThreshold: 'throughput collapses sharply past ~100 concurrent requests',
          relatedNodeIds: [node.id],
        }),
      );
    }
  }

  // 7. UNBOUNDED QUERY — endpoint querying a table with no pagination/limit.
  for (const node of nodes) {
    if (node.kind !== 'endpoint') continue;
    const content = contentFor(analysis, node);
    if (!content) continue;
    const queries = /\.(find|findAll|select|query|findMany)\b|SELECT\s/i.test(content);
    const bounded = /limit|paginate|cursor|take\b|offset|\.slice\(|LIMIT\s/i.test(content);
    if (queries && !bounded) {
      out.push(
        toDiagnostic({
          type: 'UNBOUNDED QUERY',
          title: `Unbounded query: ${node.label}`,
          what: `"${node.label}" queries the database and returns results with no pagination, limit, or cursor. It returns the whole table at scale.`,
          why: 'Returning an entire growing table balloons memory, payload size, and latency as data accumulates.',
          howToFix:
            'Add pagination (limit + offset or, better, a keyset/cursor) and a sane default page size; never return unbounded result sets.',
          optimization:
            'Use cursor-based pagination with covering indexes so deep pages stay fast.',
          userThreshold: 'response times spike once the table passes ~10,000 rows',
          relatedNodeIds: [node.id],
        }),
      );
    }
  }

  return out;
}
