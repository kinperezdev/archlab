/** Public surface of the shared contract package. */
export * from './canvas.js';
export * from './pipeline.js';
export * from './intelligence.js';
export * from './codeintel.js';
export * from './brain.js';
export * from './systemdesign.js';
export * from './ws.js';

/** Default localhost ports used across the system. */
export const PORTS = {
  /** Backend HTTP + WebSocket server. */
  backend: 4317,
  /** Frontend Vite dev server. */
  frontend: 5317,
} as const;
