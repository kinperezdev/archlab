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

export function PipelineTags({ steps, diagnostics, activeStep, onSelect, isVertical }: PipelineTagsProps) {
  return (
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
            title={`${STEP_TITLES[id]}${count > 0 ? ` — ${count} finding(s)` : ''}`}
            onClick={() => onSelect(isActive ? null : id)}
          >
            <span className="pipeline-tag-num">{i + 1}</span>
            <span className="pipeline-tag-name">{STEP_TITLES[id]}</span>
            {count > 0 && <span className="pipeline-tag-count">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
