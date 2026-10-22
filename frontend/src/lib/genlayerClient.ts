import { createClient } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';
import type { TransactionFeeEstimate, TransactionFeeOptions, WriteFeeEstimateOptions } from 'genlayer-js/types';
import { getUpdateSealConfig } from './updateSealConfig';

export type RegisterWriteFeeEstimateArgs = Pick<WriteFeeEstimateOptions, 'address' | 'functionName' | 'args'> & {
  account?: WriteFeeEstimateOptions['account'] | `0x${string}`;
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
    account?: `0x${string}`;
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
  account: `0x${string}`,
  provider: EthereumProviderLike,
): GenLayerWriteClient {
  getUpdateSealConfig();
  return createClient({
    chain: studioDevnet,
    account,
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
