import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react({
        babel: {
          plugins: [
            [
              'babel-plugin-react-compiler',
              {
                runtimeModule: 'react/compiler-runtime',
              },
            ],
          ],
        },
      }),
    ],
    server: {
      host: '0.0.0.0',
      port: 5177,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    define: {
      // Firebase environment variables are safe to be exposed on the client
      'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(
        env.VITE_FIREBASE_API_KEY
      ),
      'process.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(
        env.VITE_FIREBASE_AUTH_DOMAIN
      ),
      'process.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(
        env.VITE_FIREBASE_PROJECT_ID
      ),
      'process.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(
        env.VITE_FIREBASE_STORAGE_BUCKET
      ),
      'process.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(
        env.VITE_FIREBASE_MESSAGING_SENDER_ID
      ),
      'process.env.VITE_FIREBASE_APP_ID': JSON.stringify(
        env.VITE_FIREBASE_APP_ID
      ),
    },
    resolve: {
      alias: {
        // FIX: Replaced `__dirname` which is not available in Vite's ESM config,
        // with `path.resolve('.')` which correctly resolves to the project root.
        '@': path.resolve('.'),
      },
    },
  };
});