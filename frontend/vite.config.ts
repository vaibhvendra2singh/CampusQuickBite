import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
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
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: {
        '/api': {
          target: 'http://localhost:5001',
          changeOrigin: true,
        }
    }
  }
})

