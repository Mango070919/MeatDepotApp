
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/order-app/', // Configured for https://meatdepot.co.za/order-app/
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  define: {
    // Inject the provided API Key for Google Services (Maps/Gemini)
    'process.env.API_KEY': JSON.stringify("AIzaSyBrakc0k8b0qiBqYWGMA-Jmg6m8Xp5bk-k"),
    'process.env': process.env
  }
});
