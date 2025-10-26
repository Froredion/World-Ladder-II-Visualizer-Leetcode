import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Set base to repo name for GitHub Pages, or '/' for local development
  base: process.env.NODE_ENV === 'production' ? '/World-Ladder-II-Visualizer-Leetcode/' : '/',
})
