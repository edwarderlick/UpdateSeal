/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    env: {
      VITE_GENLAYER_RPC_URL: 'https://studio-dev.genlayer.com/api',
      VITE_GENLAYER_CHAIN_ID: '61997',
      VITE_UPDATESEAL_CONTRACT_ADDRESS: '0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3',
      VITE_UPDATESEAL_DATA_MODE: 'demo',
    },
  },
});
