/**
 * UpdateSeal Real Wallet Boundary
 * Centralizes Reown AppKit & Wagmi configuration and network definitions.
 * Mock wallet systems have been deprecated in favor of real public wallet connection.
 */
import { genlayerStudioNext, GENLAYER_CHAIN_ID, GENLAYER_RPC_URL, GENLAYER_SYMBOL, GENLAYER_EXPLORER_URL } from '../lib/network';
import { config, queryClient, isProjectConfigured, projectId, appKit } from '../lib/walletConfig';
import { WalletState, NetworkState } from '../types';

export {
  genlayerStudioNext,
  GENLAYER_CHAIN_ID,
  GENLAYER_RPC_URL,
  GENLAYER_SYMBOL,
  GENLAYER_EXPLORER_URL,
  config,
  queryClient,
  isProjectConfigured,
  projectId,
  appKit,
};

export const INITIAL_WALLET_STATE: WalletState = {
  isConnected: false,
  address: null,
  providerName: null,
  balanceGen: '0.00',
  chainId: GENLAYER_CHAIN_ID,
};

export const INITIAL_NETWORK_STATE: NetworkState = {
  chainId: GENLAYER_CHAIN_ID,
  networkName: 'GenLayer Studio-dev',
  rpcUrl: GENLAYER_RPC_URL,
  currencySymbol: GENLAYER_SYMBOL,
  isCorrectNetwork: true,
};
