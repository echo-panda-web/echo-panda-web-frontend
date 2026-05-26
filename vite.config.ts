import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: ['echo-panda.itedev.online']
  },
  plugins: [
    react() as PluginOption,
    tailwindcss() as PluginOption,
    svgr() as PluginOption
  ],
build: {
  rollupOptions: {
    output: {
      manualChunks(id) {
        if (id.includes('node_modules')) {
          if (id.includes('react-dom') || id.includes('react-router')) {
            return 'vendor'
          }
          return 'chunks'
        }
      }
    }
  }
}
})