/**
 * The structured check pipeline.
 *
 * Runs the 7 steps in their fixed order, animating each one live on the canvas
 * by emitting WebSocket messages, raising diagnostics as issues are found, and
 * finally assembling the diagnostic report. The brain is updated by the caller.
 */

import type {
  Diagnostic,
  DiagnosticReport,
  PipelineStep,
  PipelineStepId,
  ServerMessage,
} from '@archlab/shared';
import { PIPELINE_STEPS } from '@archlab/shared';
import type { AnalysisResult } from '../analyzer/analyzer.js';
import {
  countSeverities,
  performanceChecks,
  scaleChecks,
  securityChecks,
} from './checks.js';
import { architectureAdvisories } from './advisories.js';
import { detectBottlenecks } from './bottleneck.js';

/** Function used to push a message to the connected client. */
export type Emit = (msg: ServerMessage) => void;

/** Pause helper so animations are perceptible (live system feel). */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Human titles for each step. */
const STEP_TITLES: Record<PipelineStepId, string> = {
  'project-intelligence': 'Project Intelligence',
  'architecture-mapping': 'Architecture Mapping',
  'data-flow-tracing': 'Data Flow Tracing',
  'security-checks': 'Security Checks',
  'performance-checks': 'Performance & Optimization',
  'scale-analysis': 'Scale Analysis',
  'final-report': 'Final Diagnostic Report',
};

export interface PipelineOutput {
  report: DiagnosticReport;
}

/** Run the full pipeline against an analyzed project. */
export async function runPipeline(
  analysis: AnalysisResult,
  emit: Emit,
): Promise<PipelineOutput> {
  const steps: PipelineStep[] = PIPELINE_STEPS.map((id) => ({
    id,
    title: STEP_TITLES[id],
    status: 'pending',
    diagnosticIds: [],
  }));
  emit({ type: 'pipeline-init', steps });

  const allDiagnostics: Diagnostic[] = [];

  // Helper: emit a diagnostic and flash its related nodes red.
  const raise = async (d: Diagnostic) => {
    allDiagnostics.push(d);
    emit({ type: 'diagnostic', diagnostic: d });
    for (const nodeId of d.relatedNodeIds) {
      emit({ type: 'node-animate', nodeId, state: 'error' });
    }
    await sleep(120);
  };

  const begin = (id: PipelineStepId) => {
    emit({ type: 'step-status', stepId: id, status: 'running' });
    emit({ type: 'log', level: 'info', message: `Running: ${STEP_TITLES[id]}`, at: now() });
  };
  const finish = (id: PipelineStepId, summary: string, failed: boolean) => {
    emit({ type: 'step-status', stepId: id, status: failed ? 'failed' : 'passed', summary });
  };

  // ---- Step 1: Project Intelligence ------------------------------------
  begin('project-intelligence');
  await pulseAll(analysis, emit, 'processing');
  emit({ type: 'intelligence', intelligence: analysis.intelligence });
  await pulseAll(analysis, emit, 'idle');
  finish('project-intelligence', analysis.intelligence.summary, false);

  // ---- Step 2: Architecture Mapping ------------------------------------
  begin('architecture-mapping');
  // The canvas is already built; replay it node-by-node as a success glow.
  for (const node of analysis.canvas.nodes) {
    emit({ type: 'node-animate', nodeId: node.id, state: 'success' });
    await sleep(40);
    emit({ type: 'node-animate', nodeId: node.id, state: 'idle' });
  }
  // Architecture advisories: proactively flag structural gaps (no backend,
  // unconnected screens, no database, auth screens with no auth layer).
  const advisories = architectureAdvisories(analysis);
  for (const d of advisories) await raise(d);
  finish(
    'architecture-mapping',
    advisories.length > 0
      ? `Mapped ${analysis.canvas.nodes.length} nodes. ${advisories.length} architecture advisory(ies) raised.`
      : `Mapped ${analysis.canvas.nodes.length} nodes and ${analysis.canvas.edges.length} connections.`,
    false,
  );

  // ---- Step 3: Data Flow Tracing ---------------------------------------
  begin('data-flow-tracing');
  await traceDataFlow(analysis, emit);
  finish('data-flow-tracing', `Traced ${analysis.canvas.edges.length} data paths.`, false);

  // ---- Step 4: Security Checks -----------------------------------------
  begin('security-checks');
  await scanAnimate(analysis, emit);
  const sec = securityChecks(analysis);
  for (const d of sec) await raise(d);
  finish('security-checks', summarize(sec), sec.some((d) => d.severity === 'critical'));

  // ---- Step 5: Performance Checks --------------------------------------
  begin('performance-checks');
  await scanAnimate(analysis, emit);
  const perf = performanceChecks(analysis);
  for (const d of perf) await raise(d);
  finish('performance-checks', summarize(perf), false);

  // ---- Step 6: Scale Analysis (+ bottleneck detection) -----------------
  begin('scale-analysis');
  await stressAnimate(analysis, emit);
  const scale = scaleChecks(analysis);
  for (const d of scale) await raise(d);

  // Bottleneck detection runs as part of scale analysis. Bottleneck nodes are
  // flagged amber on the client (driven by the diagnostics), not flashed red.
  const bottlenecks = detectBottlenecks(analysis);
  for (const d of bottlenecks) {
    allDiagnostics.push(d);
    emit({ type: 'diagnostic', diagnostic: d });
    await sleep(60);
  }

  finish(
    'scale-analysis',
    `${summarize(scale)} ${bottlenecks.length} bottleneck(s) detected.`,
    scale.some((d) => d.severity === 'high'),
  );

  // ---- Step 7: Final Diagnostic Report ---------------------------------
  begin('final-report');
  const report: DiagnosticReport = {
    projectId: analysis.projectId,
    generatedAt: now(),
    summary: buildReportSummary(analysis, allDiagnostics),
    diagnostics: allDiagnostics,
    counts: countSeverities(allDiagnostics),
  };
  emit({ type: 'report', report });
  finish('final-report', `${allDiagnostics.length} findings across all checks.`, false);

  return { report };
}

/* ----------------------------- animations ------------------------------ */

/** Pulse every node into a state with a short stagger. */
async function pulseAll(analysis: AnalysisResult, emit: Emit, state: 'processing' | 'idle') {
  for (const node of analysis.canvas.nodes) {
    emit({ type: 'node-animate', nodeId: node.id, state });
  }
  await sleep(state === 'processing' ? 500 : 100);
}

/** Animate a packet traveling along each edge: source -> edge -> target. */
async function traceDataFlow(analysis: AnalysisResult, emit: Emit) {
  // Run edge animations concurrently with a short stagger so it looks like a clean wave
  const promises = analysis.canvas.edges.map(async (edge, index) => {
    // Stagger starts
    await sleep(Math.min(index * 30, 800));
    emit({ type: 'node-animate', nodeId: edge.source, state: 'scanning' });
    emit({ type: 'edge-animate', edgeId: edge.id, animated: true });
    await sleep(200);
    emit({ type: 'node-animate', nodeId: edge.target, state: 'scanning' });
    await sleep(200);
    emit({ type: 'node-animate', nodeId: edge.source, state: 'idle' });
    emit({ type: 'node-animate', nodeId: edge.target, state: 'idle' });
    emit({ type: 'edge-animate', edgeId: edge.id, animated: false });
  });

  // Wait for animations to complete, but cap the pipeline blocking time to 1.2s max.
  await Promise.race([
    Promise.all(promises),
    sleep(1200),
  ]);
}

/** Trace-scan every node and its connected edges. */
async function scanAnimate(analysis: AnalysisResult, emit: Emit) {
  for (const node of analysis.canvas.nodes) {
    emit({ type: 'node-animate', nodeId: node.id, state: 'scanning' });
    // Find edges connected to this node and trigger flow animation
    const connectedEdges = analysis.canvas.edges.filter(
      (e) => e.source === node.id || e.target === node.id
    );
    for (const edge of connectedEdges) {
      emit({ type: 'edge-animate', edgeId: edge.id, animated: true });
    }
    await sleep(150);
    emit({ type: 'node-animate', nodeId: node.id, state: 'idle' });
    for (const edge of connectedEdges) {
      emit({ type: 'edge-animate', edgeId: edge.id, animated: false });
    }
  }
}

/** Ramp nodes green -> yellow -> red to visualize load during scale analysis. */
async function stressAnimate(analysis: AnalysisResult, emit: Emit) {
  for (const node of analysis.canvas.nodes) {
    emit({ type: 'node-animate', nodeId: node.id, state: 'stress' });
  }
  await sleep(700);
  for (const node of analysis.canvas.nodes) {
    emit({ type: 'node-animate', nodeId: node.id, state: 'idle' });
  }
}

/* ------------------------------ helpers -------------------------------- */

function summarize(diagnostics: Diagnostic[]): string {
  if (diagnostics.length === 0) return 'No issues found.';
  const counts = countSeverities(diagnostics);
  return `${diagnostics.length} finding(s): ${counts.critical} critical, ${counts.high} high, ${counts.medium} medium, ${counts.low} low.`;
}

function buildReportSummary(analysis: AnalysisResult, diagnostics: Diagnostic[]): string {
  const counts = countSeverities(diagnostics);
  return `Analysis of ${analysis.name} complete. ${analysis.canvas.nodes.length} nodes mapped. ${diagnostics.length} total findings (${counts.critical} critical, ${counts.high} high). Tech stack: ${analysis.techStack.join(', ') || 'undetected'}.`;
}

function now(): string {
  return new Date().toISOString();
}
