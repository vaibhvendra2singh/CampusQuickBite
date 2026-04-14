import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env vars for the current mode (development / production)
  const env = loadEnv(mode, process.cwd(), '');

  /**
   * inject-sw-env
   * Replaces __PLACEHOLDER__ tokens in public/firebase-messaging-sw.js with
   * real env var values so secrets never need to be hardcoded in that file.
   *
   *  - Dev:   intercepts the /firebase-messaging-sw.js request via middleware
   *  - Build: post-processes dist/firebase-messaging-sw.js in closeBundle hook
   */
  const swTemplate = path.resolve(__dirname, 'public/firebase-messaging-sw.js');

  const injectSwEnv = {
    name: 'inject-sw-env' as const,
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        if (req.url !== '/firebase-messaging-sw.js') return next();
        const content = fs.readFileSync(swTemplate, 'utf-8')
          .replaceAll('__VITE_FIREBASE_API_KEY__', env.VITE_FIREBASE_API_KEY ?? '')
          .replaceAll('__VITE_FIREBASE_AUTH_DOMAIN__', env.VITE_FIREBASE_AUTH_DOMAIN ?? '')
          .replaceAll('__VITE_FIREBASE_PROJECT_ID__', env.VITE_FIREBASE_PROJECT_ID ?? '')
          .replaceAll('__VITE_FIREBASE_STORAGE_BUCKET__', env.VITE_FIREBASE_STORAGE_BUCKET ?? '')
          .replaceAll('__VITE_FIREBASE_MESSAGING_SENDER_ID__', env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '')
          .replaceAll('__VITE_FIREBASE_APP_ID__', env.VITE_FIREBASE_APP_ID ?? '');
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Service-Worker-Allowed', '/');
        res.end(content);
      });
    },
    closeBundle() {
      const distSw = path.resolve(__dirname, 'dist/firebase-messaging-sw.js');
      if (!fs.existsSync(distSw)) return;
      const content = fs.readFileSync(distSw, 'utf-8')
        .replaceAll('__VITE_FIREBASE_API_KEY__', env.VITE_FIREBASE_API_KEY ?? '')
        .replaceAll('__VITE_FIREBASE_AUTH_DOMAIN__', env.VITE_FIREBASE_AUTH_DOMAIN ?? '')
        .replaceAll('__VITE_FIREBASE_PROJECT_ID__', env.VITE_FIREBASE_PROJECT_ID ?? '')
        .replaceAll('__VITE_FIREBASE_STORAGE_BUCKET__', env.VITE_FIREBASE_STORAGE_BUCKET ?? '')
        .replaceAll('__VITE_FIREBASE_MESSAGING_SENDER_ID__', env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '')
        .replaceAll('__VITE_FIREBASE_APP_ID__', env.VITE_FIREBASE_APP_ID ?? '');
      fs.writeFileSync(distSw, content);
      console.log('[inject-sw-env] Firebase config injected into dist/firebase-messaging-sw.js ✓');
    },
  };

  return {
    plugins: [
      injectSwEnv,
      tailwindcss(),
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png', 'apple-touch-icon.png', 'splash-screen.png'],
        manifest: {
          name: 'CampusQuickBite',
          short_name: 'CampusBite',
          description: 'Premium Campus Food Ordering App',
          theme_color: '#0070FF',
          background_color: '#0f172a',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
                },
                cacheableResponse: {
                  statuses: [0, 203],
                },
              },
            },
          ],
        },
      }),
    ],
    build: {
      minify: 'terser',
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
            'vendor-motion': ['framer-motion'],
            'vendor-charts': ['recharts'],
            'vendor-utils': ['axios', 'socket.io-client'],
          },
        },
      },
    },
    server: {
      host: true,
      port: 5173,
      allowedHosts: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5001',
          changeOrigin: true,
        },
      },
    },
  };
});
