
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // CHANGE: Using './' makes the app flexible. It will work in ANY folder you upload it to.
  base: '/', 
  server: {
    hmr: false
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  define: {
    // API Key injected directly for production
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || "AIzaSyBrakc0k8b0qiBqYWGMA-Jmg6m8Xp5bk-k"),
  }
});
