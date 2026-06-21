/**
 * Pixel-art employee sprite, rendered as an inline SVG built from rects.
 *
 * One sprite = head + hair + body + optional accessory, all driven by the
 * employee's palette fields. Scales cleanly because everything is vector rects
 * on an integer grid. Status drives a subtle CSS animation class.
 */

import type { Employee, HairStyle, Accessory } from './companyData.js';

interface EmployeeSpriteProps {
  employee: Employee;
  scale?: number;
  /** Whether the desk is dark/empty (employee is out of office). */
  absent?: boolean;
  working?: boolean;
  isWalking?: boolean;
  flip?: boolean;
}

// Base sprite grid is 16x20 "pixels"; rects are sized in that space and the
// outer <svg> viewBox handles scaling.
const UNIT = 16;
const GRID_W = 16;
const GRID_H = 20;

function hairRects(style: HairStyle, color: string): string {
  // Returns SVG markup for the hair layer keyed off the chosen style.
  const r = (x: number, y: number, w: number, h: number) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`;
  switch (style) {
    case 'bald':
      return '';
    case 'short':
      return r(4, 1, 8, 3) + r(3, 3, 1, 3) + r(12, 3, 1, 3);
    case 'curly':
      return r(3, 0, 10, 4) + r(2, 2, 2, 3) + r(12, 2, 2, 3) + r(4, 4, 1, 1) + r(11, 4, 1, 1);
    case 'long':
      return r(4, 1, 8, 3) + r(3, 3, 1, 8) + r(12, 3, 1, 8);
    case 'ponytail':
      return r(4, 1, 8, 3) + r(12, 3, 2, 6);
    case 'bun':
      return r(4, 1, 8, 3) + r(6, -1, 4, 2);
    case 'messy':
      return r(3, 0, 10, 4) + r(5, -1, 2, 1) + r(9, -1, 2, 1) + r(3, 3, 1, 2) + r(12, 3, 1, 2);
    case 'swept':
      return r(4, 1, 9, 3) + r(11, 1, 2, 2);
    default:
      return r(4, 1, 8, 3);
  }
}

function accessoryRects(accessory: Accessory | undefined): string {
  if (!accessory) return '';
  switch (accessory) {
    case 'glasses':
      return '<rect x="5" y="6" width="2" height="2" fill="none" stroke="#0F172A" stroke-width="0.6"/><rect x="9" y="6" width="2" height="2" fill="none" stroke="#0F172A" stroke-width="0.6"/><rect x="7" y="6.7" width="2" height="0.6" fill="#0F172A"/>';
    case 'headphones':
      return '<rect x="3" y="3" width="1.5" height="4" fill="#111827"/><rect x="11.5" y="3" width="1.5" height="4" fill="#111827"/><rect x="4" y="2" width="8" height="1.4" fill="#111827"/>';
    case 'coffee':
      return '<rect x="12" y="12" width="3" height="3" fill="#7C3E12"/><rect x="12.5" y="11.5" width="2" height="1" fill="#C0793A"/>';
    case 'phone':
      return '<rect x="12" y="10" width="2" height="3" fill="#0EA5E9"/>';
    case 'clipboard':
      return '<rect x="11.5" y="11" width="3.5" height="4.5" fill="#E5E7EB"/><rect x="12.5" y="10.6" width="1.5" height="0.8" fill="#9CA3AF"/>';
    case 'tablet':
      return '<rect x="11" y="11" width="4" height="5" rx="0.6" fill="#1F2937" stroke="#374151" stroke-width="0.4"/>';
    case 'stylus':
      return '<rect x="13" y="9" width="0.8" height="4" fill="#E11D48"/>';
    default:
      return '';
  }
}

export function EmployeeSprite({
  employee,
  scale = 1,
  absent = false,
  working = false,
  isWalking = false,
  flip = false,
}: EmployeeSpriteProps) {
  const w = GRID_W * scale;
  const h = GRID_H * scale;

  if (absent) {
    return (
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${GRID_W} ${GRID_H}`}
        className="archco-sprite archco-sprite-absent"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <rect x="3" y="14" width="10" height="4" fill="#1A1A2E" stroke="#26263A" strokeWidth="0.5" />
        <rect x="6" y="9" width="4" height="3" fill="#141422" />
        <text x="8" y="7" textAnchor="middle" fontSize="3" fill="#475569">
          out
        </text>
      </svg>
    );
  }

  const skin = employee.skinTone;
  const body = employee.color;
  const hair = hairRects(employee.hairStyle, employee.hairColor);
  const acc = accessoryRects(employee.accessory);

  const inner = [
    // soft contact shadow under the person
    `<ellipse cx="8" cy="19" rx="6" ry="1.2" fill="#000000" opacity="0.35"/>`,
    // body / torso (the chair lives at the desk in the scene, not on the sprite,
    // so people don't "carry" a chair around as they walk)
    `<rect x="4" y="11" width="8" height="7" rx="1.5" fill="${body}"/>`,
    // clothing detail: white collar and red tie
    `<polygon points="7,11 9,11 8,13" fill="#FFFFFF"/>`,
    `<rect x="7.6" y="13" width="0.8" height="3" fill="#EF4444" rx="0.3"/>`,
    // arms
    `<rect x="3" y="11.5" width="1.6" height="5" rx="0.8" fill="${body}"/>`,
    `<rect x="11.4" y="11.5" width="1.6" height="5" rx="0.8" fill="${body}"/>`,
    // neck
    `<rect x="7" y="9.5" width="2" height="2" fill="${skin}"/>`,
    // head
    `<rect x="5" y="4" width="6" height="6" rx="1.5" fill="${skin}"/>`,
    hair,
    // upgraded high-contrast eyes (white + dark pupil) rendered after hair
    `<rect x="6.4" y="6.4" width="1" height="1" fill="#FFFFFF"/>`,
    `<rect x="7.4" y="6.4" width="1" height="1" fill="#0F172A"/>`,
    `<rect x="8.4" y="6.4" width="1" height="1" fill="#FFFFFF"/>`,
    `<rect x="9.4" y="6.4" width="1" height="1" fill="#0F172A"/>`,
    // cute mouth
    `<rect x="7.4" y="8.2" width="1.2" height="0.8" fill="#B91C1C" opacity="0.65"/>`,
    acc,
  ].join('');

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${GRID_W} ${GRID_H}`}
      className={`archco-sprite${working ? ' archco-sprite-working' : ''}${isWalking ? ' archco-sprite-walking' : ''}`}
      style={flip ? { transform: 'scaleX(-1)' } : undefined}
      shapeRendering="crispEdges"
      aria-label={`${employee.name}, ${employee.role}`}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}

export const SPRITE_UNIT = UNIT;
