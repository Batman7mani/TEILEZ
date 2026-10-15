import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Production build is served from GitHub Pages at /TEILEZ/; dev stays at /.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/TEILEZ/' : '/',
}))
