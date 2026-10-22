import { defineChain } from 'viem';

export const GENLAYER_RPC_URL = import.meta.env.VITE_GENLAYER_RPC_URL || 'https://studio-dev.genlayer.com/api';
export const GENLAYER_CHAIN_ID = Number(import.meta.env.VITE_GENLAYER_CHAIN_ID) || 61997;
export const GENLAYER_CHAIN_NAME = import.meta.env.VITE_GENLAYER_CHAIN_NAME || 'GenLayer Studio-dev';
export const GENLAYER_SYMBOL = import.meta.env.VITE_GENLAYER_SYMBOL || 'GEN';
export const GENLAYER_EXPLORER_URL = import.meta.env.VITE_GENLAYER_EXPLORER_URL || 'https://explorer-studio-dev.genlayer.com/';

export const genlayerStudioNext = defineChain({
  id: GENLAYER_CHAIN_ID,
  name: GENLAYER_CHAIN_NAME,
  nativeCurrency: {
    name: GENLAYER_SYMBOL,
    symbol: GENLAYER_SYMBOL,
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [GENLAYER_RPC_URL],
    },
    public: {
      http: [GENLAYER_RPC_URL],
    },
  },
  blockExplorers: {
    default: {
      name: 'GenLayer Explorer',
      url: GENLAYER_EXPLORER_URL,
    },
  },
});
