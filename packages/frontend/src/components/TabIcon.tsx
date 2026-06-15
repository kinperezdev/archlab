/**
 * Small inline SVG icons for the filter tabs. One glyph per tab, drawn with
 * currentColor so they inherit the tab's active/inactive color.
 */

import type { ArchTab } from '../App.js';

const COMMON = {
  width: 14,
  height: 14,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function TabIcon({ tab }: { tab: ArchTab }) {
  switch (tab) {
    case 'all': // grid
      return (
        <svg {...COMMON} className="tab-icon" aria-hidden="true">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      );
    case 'frontend': // monitor
      return (
        <svg {...COMMON} className="tab-icon" aria-hidden="true">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      );
    case 'backend': // server
      return (
        <svg {...COMMON} className="tab-icon" aria-hidden="true">
          <rect x="2" y="3" width="20" height="7" rx="2" />
          <rect x="2" y="14" width="20" height="7" rx="2" />
          <path d="M6 6.5h.01M6 17.5h.01" />
        </svg>
      );
    case 'database': // database cylinder
      return (
        <svg {...COMMON} className="tab-icon" aria-hidden="true">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5" />
          <path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6" />
        </svg>
      );
    case 'api': // route arrow
      return (
        <svg {...COMMON} className="tab-icon" aria-hidden="true">
          <circle cx="5" cy="19" r="2" />
          <circle cx="19" cy="5" r="2" />
          <path d="M7 19h6a4 4 0 0 0 4-4V7" />
          <path d="M14 8l3-3 3 3" />
        </svg>
      );
    case 'security': // shield
      return (
        <svg {...COMMON} className="tab-icon" aria-hidden="true">
          <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z" />
        </svg>
      );
    case 'systemdesign': // stacked server / infrastructure
      return (
        <svg {...COMMON} className="tab-icon" aria-hidden="true">
          <rect x="3" y="3" width="18" height="6" rx="1" />
          <rect x="3" y="11" width="18" height="6" rx="1" />
          <path d="M7 6h.01M7 14h.01M11 6h6M11 14h6" />
          <path d="M9 17v2M15 17v2M7 21h10" />
        </svg>
      );
    case 'scratch': // pencil
      return (
        <svg {...COMMON} className="tab-icon" aria-hidden="true">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      );
    default:
      return null;
  }
}
