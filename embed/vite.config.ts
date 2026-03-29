import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5174,
    proxy: {
      '/api': 'http://localhost:3000',
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
  build: {
    lib: {
      entry: 'src/widget.ts',
      name: 'ScheduleWidget',
      fileName: 'widget',
      formats: ['iife'],
    },
    rollupOptions: {
      // bundle everything — no externals for the IIFE
    },
  },
})
