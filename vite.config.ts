// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  // other configurations...
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
  // other configurations...
});