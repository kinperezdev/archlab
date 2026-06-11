import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ArchLab frontend dev server. Localhost only, fixed port from the shared contract.
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5317,
    strictPort: true,
  },
});
