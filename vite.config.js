import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { r2VitePlugin } from './server/r2ServerPlugin.js';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), r2VitePlugin()],
  server: {
    port: 5173,
    open: true,
  },
});
