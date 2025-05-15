import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  root: path.resolve(__dirname, 'frontend'), // 👈 Set the root to ./frontend
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, 'dist'), // 👈 Output outside frontend
    emptyOutDir: true,
  },
  server: {
    port: 5173, // optional
  },
})
