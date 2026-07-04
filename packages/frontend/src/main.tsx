/**
 * Frontend entry point.
 *
 * Fetches the backend session token FIRST (initSession patches window.fetch so
 * every backend call carries it automatically), then mounts <App/>. All global
 * stylesheets are imported here, in cascade order.
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { initSession } from './lib/session.js';
import './styles/tailwind.css';
import './styles/tokens.css';
import './styles/global.css';
import './styles/canvas.css';
import './styles/features.css';
import './styles/codeintel.css';
import './styles/systemdesign.css';
import './styles/agents.css';
import './styles/redesign.css';
import './styles/confidence.css';
import './styles/simulation.css';
import './styles/emptystate.css';
import 'reactflow/dist/style.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

class RootErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ArchLab] root render failed', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="root-error-screen">
        <div className="root-error-panel">
          <h1>ArchLab hit a render error</h1>
          <p>{this.state.error.message || 'Unknown render error.'}</p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}

// Obtain the session token and install the auth'd fetch wrapper before the app
// mounts, so every backend call (and the WebSocket) is authenticated.
void initSession().finally(() => {
  createRoot(root).render(
    <React.StrictMode>
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    </React.StrictMode>,
  );
});
