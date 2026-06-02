import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) return 'firebase';
          if (id.includes('node_modules/@tiptap') || id.includes('node_modules/prosemirror')) return 'editor';
          if (id.includes('node_modules/@dnd-kit')) return 'dnd';
          if (id.includes('node_modules/framer-motion')) return 'motion';
          return undefined;
        },
      },
    },
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
    },
    proxy: {
      '/__': {
        target: 'https://neural-cortex-app-2026.firebaseapp.com',
        changeOrigin: true,
      }
    }
  }
})
