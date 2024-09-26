import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // based on figma's browser support matrix
    target: ['chrome99', 'firefox101', 'safari16'],
  },
})
