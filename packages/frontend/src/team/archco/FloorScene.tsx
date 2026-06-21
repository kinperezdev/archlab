/**
 * A single floor's office scene.
 *
 * Renders the floor background, the elevator, every desk for the floor, and the
 * employees who are present. Absent employees show a dark empty desk. Each
 * present employee gets a status task-badge above their head.
 */

import type { Employee, EmployeeStatus, Floor } from './companyData.js';
import { employeesOnFloor } from './companyData.js';
import { FLOOR_CONFIGS } from './floorLayouts.js';
import type { TimeState } from './timeSystem.js';
import { EmployeeSprite } from './EmployeeSprite.js';

export type ThreatLevel = 'green' | 'yellow' | 'red' | 'flashing';

interface FloorSceneProps {
  floor: Floor;
  timeState: TimeState;
  presentIds: ReadonlySet<string>;
  taskBadges: Record<string, { label: string; severity: 'critical' | 'high' | 'medium' | 'low' }>;
  threatLevel?: ThreatLevel;
  onSelect: (employee: Employee) => void;
}

const SCENE_W = 720;
const SCENE_H = 320;
const ELEVATOR_X = SCENE_W - 56;

const SEVERITY_COLOR: Record<'critical' | 'high' | 'medium' | 'low', string> = {
  critical: '#F87171',
  high: '#FBBF24',
  medium: '#34D399',
  low: '#64748B',
};

function statusIcon(status: EmployeeStatus): string {
  switch (status) {
    case 'gone-home':
      return '🏠';
    case 'on-call':
      return '📞';
    case 'break':
      return '☕';
    case 'meeting':
      return '👥';
    case 'idle':
      return '⏳';
    default:
      return '';
  }
}

export function FloorScene({
  floor,
  timeState,
  presentIds,
  taskBadges,
  threatLevel = 'green',
  onSelect,
}: FloorSceneProps) {
  const config = FLOOR_CONFIGS[floor];
  const employees = employeesOnFloor(floor);
  const lit = timeState.lightLevel;

  return (
    <div className="archco-scene-wrap" style={{ background: config.backgroundColor }}>
      {/* Lighting overlay tracks day/night. */}
      <div
        className="archco-light-overlay"
        style={{ opacity: 1 - lit }}
        aria-hidden="true"
      />
      {floor === 4 && (
        <div className={`archco-threat-tint threat-${threatLevel}`} aria-hidden="true" />
      )}

      <svg
        viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
        className="archco-scene-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Back wall + floor band */}
        <rect x="0" y="0" width={SCENE_W} height={SCENE_H} fill={config.backgroundColor} />
        <rect x="0" y="0" width={SCENE_W} height="70" fill={config.wallColor} />
        <rect x="0" y={SCENE_H - 40} width={SCENE_W} height="40" fill={config.wallColor} opacity="0.6" />

        {/* Elevator on the right edge */}
        <g>
          <rect
            x={ELEVATOR_X}
            y="80"
            width="44"
            height="150"
            rx="4"
            fill="#10101A"
            stroke={config.accentColor}
            strokeWidth="1.5"
          />
          <line
            x1={ELEVATOR_X + 22}
            y1="84"
            x2={ELEVATOR_X + 22}
            y2="226"
            stroke={config.accentColor}
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text x={ELEVATOR_X + 22} y="74" textAnchor="middle" fill={config.accentColor} fontSize="10">
            ▲ {floor}
          </text>
        </g>

        {/* Floor 4 threat indicator */}
        {floor === 4 && (
          <g>
            <rect x="20" y="14" width="150" height="26" rx="4" fill="#160808" stroke="#7F1D1D" />
            <text x="30" y="31" fill="#F87171" fontSize="12" fontWeight="700">
              THREAT: {threatLevel.toUpperCase()}
            </text>
          </g>
        )}
      </svg>

      {/* Employees layered over the SVG (HTML for crisp text + click). */}
      <div className="archco-employee-layer">
        {employees.map((emp) => {
          const present = presentIds.has(emp.id);
          const badge = taskBadges[emp.id];
          const x = Math.min(emp.deskPosition.x, ELEVATOR_X - 60);
          const y = emp.deskPosition.y + 40;
          const icon = statusIcon(emp.status);
          return (
            <button
              key={emp.id}
              className="archco-employee"
              style={{ left: x, top: y }}
              onClick={() => onSelect(emp)}
              title={`${emp.name} · ${emp.role}`}
            >
              {present && (badge || emp.status !== 'working') && (
                <span
                  className={`archco-task-badge${emp.status === 'working' ? ' pulsing' : ''}`}
                  style={{
                    background: badge ? `${SEVERITY_COLOR[badge.severity]}22` : '#1A1A2E',
                    borderColor: badge ? SEVERITY_COLOR[badge.severity] : '#26263A',
                    color: badge ? SEVERITY_COLOR[badge.severity] : '#94A3B8',
                  }}
                >
                  {icon} {badge ? badge.label : emp.status}
                </span>
              )}
              <EmployeeSprite
                employee={emp}
                scale={2}
                absent={!present}
                working={present && emp.status === 'working'}
              />
              <span className="archco-employee-name">{emp.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const ARCHCO_SCENE_W = SCENE_W;
export const ARCHCO_SCENE_H = SCENE_H;
