import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/family-hub/',
  // Stamped at build time so the in-app version badge always shows when
  // this deploy was actually built, with no manual bookkeeping needed.
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
})
