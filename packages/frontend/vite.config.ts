import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// ArchLab frontend dev server. Localhost only, fixed port from the shared contract.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5317,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor-react';
          if (id.includes('node_modules/reactflow') || id.includes('node_modules/@reactflow')) return 'vendor-flow';
          if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) return 'vendor-motion';
          if (id.includes('node_modules/highlight.js')) return 'vendor-highlight';
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
          return undefined;
        },
      },
    },
  },
});
