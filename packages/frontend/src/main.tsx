import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
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
import 'reactflow/dist/style.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
