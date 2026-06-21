/**
 * Renders a single {@link DocDiagram} as an inline SVG inside a dark card.
 *
 * The diagram body is authored as raw SVG markup in `docsContent.ts`; we trust
 * it because it is fully static, first-party content with no user input. SVGs
 * are only mounted when the parent article is selected (the article list never
 * mounts non-selected articles), satisfying the lazy-render requirement.
 */

import type { DocDiagram as DocDiagramType } from './docsTypes.js';

interface DocDiagramProps {
  diagram: DocDiagramType;
}

/**
 * Each authored diagram begins with a transparent background rect whose
 * width/height encode the intended viewBox. Read those so every diagram renders
 * at its true aspect ratio instead of a fixed box.
 */
function readViewBox(svgContent: string): { width: number; height: number } {
  const match = svgContent.match(/width="(\d+)"\s+height="(\d+)"\s+rx="0"/);
  if (match) return { width: Number(match[1]), height: Number(match[2]) };
  return { width: 720, height: 320 };
}

export function DocDiagram({ diagram }: DocDiagramProps) {
  const { width, height } = readViewBox(diagram.svgContent);
  return (
    <figure className="doc-diagram">
      <figcaption className="doc-diagram-title">{diagram.title}</figcaption>
      <div className="doc-diagram-canvas">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={diagram.title}
          // First-party static markup authored in docsContent.ts only.
          dangerouslySetInnerHTML={{ __html: diagram.svgContent }}
        />
      </div>
      <p className="doc-diagram-desc">{diagram.description}</p>
    </figure>
  );
}
