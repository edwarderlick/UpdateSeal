import { createClient } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';
import type { TransactionFeeEstimate, TransactionFeeOptions } from 'genlayer-js/types';
import type { Account, Address } from 'viem';
import { toGenLayerJsonRpcAccount } from './genlayerAccount';
import { getUpdateSealConfig } from './updateSealConfig';

export type RegisterWriteFeeEstimateArgs = {
  account?: Account;
  address: `0x${string}`;
  functionName: string;
  args?: unknown[];
};

export interface GenLayerReadClient {
  readContract: (args: {
    address: `0x${string}`;
    functionName: string;
    args?: unknown[];
  }) => Promise<unknown>;
  waitForTransactionReceipt: (args: {
    hash: `0x${string}`;
    waitUntil?: 'decided' | 'finalized';
    interval?: number;
    retries?: number;
    fullTransaction?: boolean;
  }) => Promise<unknown>;
}

export interface EthereumProviderLike {
  request: (args: { method: string; params?: unknown }) => Promise<unknown>;
}

export interface GenLayerWriteClient {
  estimateTransactionFeesForWrite: (args: RegisterWriteFeeEstimateArgs) => Promise<TransactionFeeEstimate>;
  writeContract: (args: {
    account?: Account;
    address: `0x${string}`;
    functionName: string;
    args?: unknown[];
    fees?: TransactionFeeOptions;
  }) => Promise<unknown>;
  waitForTransactionReceipt: (args: {
    hash: `0x${string}`;
    waitUntil?: 'decided' | 'finalized';
    interval?: number;
    retries?: number;
    fullTransaction?: boolean;
  }) => Promise<unknown>;
}

let client: GenLayerReadClient | null = null;
let createCount = 0;

export function getReadOnlyGenLayerClient(): GenLayerReadClient {
  getUpdateSealConfig();
  if (!client) {
    createCount += 1;
    client = createClient({
      chain: studioDevnet,
    }) as unknown as GenLayerReadClient;
  }
  return client;
}

export function createWriteGenLayerClient(
  address: Address,
  provider: EthereumProviderLike,
): GenLayerWriteClient {
  getUpdateSealConfig();
  const account = toGenLayerJsonRpcAccount(address);
  // genlayer-js@2.0.0-rc.1 getCustomTransportConfig routes PROVIDER_METHODS
  // (eth_sendTransaction) through the injected wallet only when
  // `typeof config.account !== "object"`. Estimate/write still need a Viem
  // JSON-RPC Account so SDK encoding can read `.address`. Passing the
  // checksummed address string here is the narrow SDK-boundary exception that
  // keeps wallet submission on the provider path.
  return createClient({
    chain: studioDevnet,
    account: account.address,
    provider,
  }) as unknown as GenLayerWriteClient;
}

export function resetGenLayerClientForTests(): void {
  client = null;
  createCount = 0;
}

export function getGenLayerClientCreateCountForTests(): number {
  return createCount;
}
