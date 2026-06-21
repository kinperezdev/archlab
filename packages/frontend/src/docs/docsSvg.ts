/**
 * Reusable SVG primitives for Docs diagrams.
 *
 * Every diagram in `docsContent.ts` is hand-authored from these helpers so the
 * visual language stays consistent (ArchLab palette, rounded nodes, indigo
 * accents) without repeating raw markup. Each helper returns an SVG fragment
 * string; `DocDiagram.svgContent` holds the concatenation of fragments and is
 * dropped inside an <svg> by {@link DocDiagram}.
 */

const PALETTE = {
  card: '#0F0F17',
  cardAlt: '#141422',
  stroke: '#26263A',
  accent: '#6366F1',
  accentSoft: '#312E81',
  text: '#E2E8F0',
  muted: '#64748B',
  green: '#34D399',
  amber: '#FBBF24',
  red: '#F87171',
  purple: '#A78BFA',
} as const;

export type SvgColorKey = keyof typeof PALETTE;
const color = (k: SvgColorKey | string): string =>
  (PALETTE as Record<string, string>)[k] ?? k;

/** A rounded node box with centered (optionally two-line) label. */
export function box(
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  opts: { fill?: string; stroke?: string; sub?: string } = {},
): string {
  const fill = color(opts.fill ?? 'card');
  const stroke = color(opts.stroke ?? 'stroke');
  const cy = opts.sub ? y + h / 2 - 6 : y + h / 2;
  const main = `<text x="${x + w / 2}" y="${cy}" text-anchor="middle" dominant-baseline="middle" fill="${PALETTE.text}" font-size="13" font-weight="600">${esc(label)}</text>`;
  const sub = opts.sub
    ? `<text x="${x + w / 2}" y="${y + h / 2 + 12}" text-anchor="middle" fill="${PALETTE.muted}" font-size="10.5">${esc(opts.sub)}</text>`
    : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>${main}${sub}`;
}

/** A directed connector with an arrowhead and optional mid label. */
export function arrow(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  opts: { label?: string; stroke?: string; dashed?: boolean } = {},
): string {
  const stroke = color(opts.stroke ?? 'accent');
  const dash = opts.dashed ? ' stroke-dasharray="5 4"' : '';
  const line = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="1.6" marker-end="url(#arrowhead)"${dash}/>`;
  const lbl = opts.label
    ? `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 6}" text-anchor="middle" fill="${PALETTE.muted}" font-size="10.5">${esc(opts.label)}</text>`
    : '';
  return line + lbl;
}

/** A free-floating caption / annotation. */
export function label(
  x: number,
  y: number,
  text: string,
  opts: { fill?: SvgColorKey | string; size?: number; weight?: number; anchor?: string } = {},
): string {
  return `<text x="${x}" y="${y}" text-anchor="${opts.anchor ?? 'start'}" fill="${color(opts.fill ?? 'text')}" font-size="${opts.size ?? 12}" font-weight="${opts.weight ?? 400}">${esc(text)}</text>`;
}

/** A subtle horizontal lane divider. */
export function lane(x1: number, y: number, x2: number, text?: string): string {
  const line = `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${PALETTE.stroke}" stroke-width="1" stroke-dasharray="3 5"/>`;
  const lbl = text ? label(x1, y - 6, text, { fill: 'muted', size: 10.5 }) : '';
  return line + lbl;
}

/** Defs block (arrowhead marker) prepended to every diagram. */
export function defs(): string {
  return `<defs><marker id="arrowhead" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto"><path d="M0,0 L7,3 L0,6 Z" fill="${PALETTE.accent}"/></marker></defs>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export const SVG = { box, arrow, label, lane, defs, PALETTE };
