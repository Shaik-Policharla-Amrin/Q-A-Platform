import { defineConfig, UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const config: UserConfig = defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    'process.env': process.env, // Helps when using legacy env access in some dependencies
  },
});

export default config;