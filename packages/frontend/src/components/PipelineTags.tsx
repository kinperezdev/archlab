/**
 * Security-tab pipeline tags.
 *
 * Renders the 7 pipeline steps as tag chips on the Security canvas, above the
 * findings. Colour encodes state: green (passed), blue + pulse (running), red
 * (raised issues / failed), grey (not yet run). Clicking a tag filters the
 * findings panel to that step; clicking the active tag clears the filter.
 */

import { PIPELINE_STEPS, type Diagnostic, type PipelineStep, type PipelineStepId } from '@archlab/shared';

/** Display titles for every step, so all 7 chips show even before a run. */
const STEP_TITLES: Record<PipelineStepId, string> = {
  'project-intelligence': 'Project Intelligence',
  'architecture-mapping': 'Architecture Mapping',
  'data-flow-tracing': 'Data Flow Tracing',
  'security-checks': 'Security Checks',
  'performance-checks': 'Performance Checks',
  'scale-analysis': 'Scale Analysis',
  'final-report': 'Final Report',
};

/** Plain-English transparency: what each step actually does and checks. */
const STEP_DETAILS: Record<PipelineStepId, { summary: string; checks: string[] }> = {
  'project-intelligence': {
    summary: 'Reads your README, package manifests, and file structure to understand what the project is.',
    checks: ['Project purpose & detected stack', 'Dependencies, scripts & configs', 'File and module inventory'],
  },
  'architecture-mapping': {
    summary: 'Builds the dependency graph: which files import which, and how the layers connect.',
    checks: ['Import / export graph', 'Entry points and layers', 'Connected vs isolated modules'],
  },
  'data-flow-tracing': {
    summary: 'Follows user data from where it enters the app through to where it is stored.',
    checks: ['Request to handler to store paths', 'Cross-boundary data movement', 'Dead-end or untraced flows'],
  },
  'security-checks': {
    summary: 'Scans the attack surface for common gaps in auth, data access, and config.',
    checks: ['Exposed secrets / public config', 'Auth & access-control gaps', 'Injection & input-validation risks'],
  },
  'performance-checks': {
    summary: 'Looks for slow patterns and inefficiencies in how the code does work.',
    checks: ['N+1 and unbounded queries', 'Blocking operations on hot paths', 'Missing caching or pagination'],
  },
  'scale-analysis': {
    summary: 'Flags the bottlenecks that hold up fine now but break as load grows.',
    checks: ['Single points of failure', 'Choke points and DB hotspots', 'Fragile real-time / render paths'],
  },
  'final-report': {
    summary: 'Aggregates every finding into the production-readiness verdict.',
    checks: ['Severity rollup', 'Production-readiness score', 'Prioritized action plan'],
  },
};

type TagState = 'pending' | 'running' | 'passed' | 'issues';

interface PipelineTagsProps {
  steps: PipelineStep[];
  diagnostics: Diagnostic[];
  activeStep: PipelineStepId | null;
  onSelect: (stepId: PipelineStepId | null) => void;
  isVertical?: boolean;
}

function tagState(
  stepId: PipelineStepId,
  steps: PipelineStep[],
  diagnostics: Diagnostic[],
): TagState {
  const live = steps.find((s) => s.id === stepId);
  const hasIssues = diagnostics.some((d) => d.step === stepId);
  if (live?.status === 'running') return 'running';
  if (hasIssues || live?.status === 'failed') return 'issues';
  if (live?.status === 'passed') return 'passed';
  return 'pending';
}

export function PipelineTags({
  steps,
  diagnostics,
  activeStep,
  onSelect,
  isVertical,
}: PipelineTagsProps) {
  return (
    <>
      <div className={`pipeline-tags ${isVertical ? 'flat-vertical' : ''}`} role="list" aria-label="Pipeline steps">
        {PIPELINE_STEPS.map((id, i) => {
          const state = tagState(id, steps, diagnostics);
          const count = diagnostics.filter((d) => d.step === id).length;
          const isActive = activeStep === id;
          return (
            <button
              key={id}
              type="button"
              role="listitem"
              className={`pipeline-tag tag-${state}${isActive ? ' tag-active' : ''}`}
              title={`${STEP_TITLES[id]}${count > 0 ? `: ${count} finding(s)` : ''}`}
              onClick={() => onSelect(isActive ? null : id)}
            >
              <span className="pipeline-tag-num">{state === 'passed' ? '✓' : i + 1}</span>
              <span className="pipeline-tag-name">{STEP_TITLES[id]}</span>
              {count > 0 && <span className="pipeline-tag-count">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Transparency: clicking a step reveals what it actually does + checks. */}
      {activeStep && (
        <div className="pipeline-detail">
          <div className="pipeline-detail-head">
            <span className="pipeline-detail-title">{STEP_TITLES[activeStep]}</span>
            <button
              type="button"
              className="pipeline-detail-close"
              title="Close"
              onClick={() => onSelect(null)}
            >
              ✕
            </button>
          </div>
          <p className="pipeline-detail-summary">{STEP_DETAILS[activeStep].summary}</p>
          <span className="pipeline-detail-label">What it checks</span>
          <ul className="pipeline-detail-list">
            {STEP_DETAILS[activeStep].checks.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <p className="pipeline-detail-result">
            {(() => {
              const n = diagnostics.filter((d) => d.step === activeStep).length;
              const state = tagState(activeStep, steps, diagnostics);
              if (state === 'running') return 'Running now…';
              if (n > 0) return `${n} finding${n === 1 ? '' : 's'} below.`;
              if (state === 'passed') return 'Passed. No issues found.';
              return 'Not run yet.';
            })()}
          </p>
        </div>
      )}
    </>
  );
}
