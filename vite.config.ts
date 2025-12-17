import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/factorial': {
          target: 'https://api.factorialhr.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/factorial/, ''),
          secure: false,
        },
      },
    },
    plugins: [
      react(),
      tailwindcss()
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});