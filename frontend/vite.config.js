import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname), // Ensure it runs from /frontend
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  base: './' // For GitHub Pages, ensures relative asset paths
})
