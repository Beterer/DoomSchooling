import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

function legacyPwaCompatibility(): Plugin {
  return {
    name: 'legacy-pwa-compatibility',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = request.url?.split('?')[0];
        if (path !== '/@vite-plugin-pwa/pwa-entry-point-loaded') {
          next();
          return;
        }

        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/javascript');
        response.end('export default true;');
      });
    },
  };
}

export default defineConfig({
  plugins: [legacyPwaCompatibility(), react(), tailwindcss()],
  envDir: fileURLToPath(new URL('../..', import.meta.url)),
  resolve: {
    conditions: ['@tanstack/custom-condition'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
