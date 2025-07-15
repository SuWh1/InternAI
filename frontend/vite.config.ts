import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import critical from 'rollup-plugin-critical'

// https://vite.dev/config/
export default defineConfig({
  root: './frontend', 
  appType: 'spa', 
  plugins: [
    react(),
    tailwindcss(),
    {
      ...critical({
        criticalUrl: 'http://localhost:4173',
        criticalBase: 'dist',
        criticalPages: [
          { uri: '/', template: 'index' }
        ],
        criticalConfig: {
          inline: true,
          extract: false,
          width: 1300,
          height: 900,
        },
      }),
      apply: 'build',
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://internai_backend:8000',
        changeOrigin: true,
        secure: false,
      },
    },
    fs: {
      strict: false,
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            if (id.includes('react-router-dom')) {
              return 'router-vendor'
            }
            if (id.includes('framer-motion') || id.includes('lucide-react')) {
              return 'ui-vendor'
            }
            if (id.includes('reactflow')) {
              return 'flow-vendor'
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor'
            }
            return 'vendor'
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
