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
      VITE_UPDATESEAL_CONTRACT_ADDRESS: '0x6A882db328782051dFf05C40F4C34b3F223cd80A',
      VITE_UPDATESEAL_DATA_MODE: 'demo',
    },
  },
});
