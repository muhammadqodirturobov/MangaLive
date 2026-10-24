import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(async ({ command }) => {
  const plugins = [react()];

  // server/r2ServerPlugin.js provides local dev/preview server middleware for Cloudflare R2 proxying.
  // It is conditionally loaded only when the file exists on disk (local development)
  // to prevent build failures in environments (like Vercel production builds) where server/ is not included.
  const r2PluginPath = path.resolve(__dirname, 'server', 'r2ServerPlugin.js');
  if (fs.existsSync(r2PluginPath)) {
    try {
      const { r2VitePlugin } = await import('./server/r2ServerPlugin.js');
      if (typeof r2VitePlugin === 'function') {
        plugins.push(r2VitePlugin());
      }
    } catch (err) {
      console.warn('[vite.config.js] Notice: server/r2ServerPlugin.js not loaded:', err.message);
    }
  }

  return {
    plugins,
    server: {
      port: 5173,
      open: true,
    },
  };
});
