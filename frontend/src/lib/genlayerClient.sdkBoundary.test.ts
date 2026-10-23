import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createClient } from 'genlayer-js';
import { studioDevnet } from 'genlayer-js/chains';
import { getAddress, zeroAddress, type Account, type Address } from 'viem';
import { toGenLayerJsonRpcAccount } from './genlayerAccount';
import { createWriteGenLayerClient } from './genlayerClient';
import { resetUpdateSealConfigCache } from './updateSealConfig';

const SENDER = '0x82fde1090c2941e5d8742a944813ebfc09c91c12' as Address;
const CHECKSUM = getAddress(SENDER);
const CONTRACT = '0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3' as const;
const TX_HASH = ('0x' + 'ab'.repeat(32)) as `0x${string}`;
const BLOCK_HASH = ('0x' + '11'.repeat(32)) as `0x${string}`;

interface CapturedRpc {
  method: string;
  from?: string;
}

function firstFrom(params: unknown): string | undefined {
  if (!Array.isArray(params) || params.length === 0) {
    return undefined;
  }
  const head = params[0];
  if (head && typeof head === 'object' && !Array.isArray(head) && 'from' in head) {
    const from = (head as { from?: unknown }).from;
    return typeof from === 'string' ? from : undefined;
  }
  return undefined;
}

const FEE_DISTRIBUTION = {
  leaderTimeunitsAllocation: '1',
  validatorTimeunitsAllocation: '1',
  appealRounds: '0',
  executionBudgetPerRound: '10',
  executionConsumed: '0',
  totalMessageFees: '0',
  rotations: ['1'],
  maxPriceGenPerTimeUnit: '10',
  storageFeeMaxGasPrice: '10',
  receiptFeeMaxGasPrice: '10',
};

function studioFeeConfig() {
  return {
    enabled: true,
    policy: {
      genPerTimeUnit: '1',
      storageUnitPrice: '1',
      receiptGasPrice: '1',
      timeUnitOverlayBps: '0',
    },
  };
}

function studioFeeEstimate() {
  return {
    recommendedPreset: {
      feeValue: '1000000000000000',
      distribution: FEE_DISTRIBUTION,
    },
  };
}

function successfulReceipt(from: string) {
  return {
    transactionHash: TX_HASH,
    transactionIndex: '0x0',
    blockHash: BLOCK_HASH,
    blockNumber: '0x1',
    from,
    to: '0xb7278A61aa25c888815aFC32Ad3cC52fF24fE575',
    cumulativeGasUsed: '0x5208',
    gasUsed: '0x5208',
    contractAddress: null,
    logs: [],
    logsBloom: `0x${'00'.repeat(256)}`,
    status: '0x1',
    effectiveGasPrice: '0x1',
    type: '0x0',
  };
}

describe('pinned genlayer-js@2.0.0-rc.1 account boundary', () => {
  const captured: CapturedRpc[] = [];
  const realFetch = globalThis.fetch;
  const provider = {
    request: vi.fn(async ({ method, params }: { method: string; params?: unknown }) => {
      return handleRpc(method, params);
    }),
  };

  function handleRpc(method: string, params: unknown): unknown {
    const from = firstFrom(params);
    captured.push({ method, from });
    switch (method) {
      case 'sim_getFeeConfig':
        return studioFeeConfig();
      case 'sim_estimateTransactionFees':
        return studioFeeEstimate();
      case 'gen_call':
        throw new Error('gen_call should not be required when sim_estimateTransactionFees succeeds');
      case 'eth_getTransactionCount':
        return '0x1';
      case 'eth_estimateGas':
        return '0x5208';
      case 'eth_gasPrice':
        return '0x1';
      case 'eth_chainId':
        return '0xf21d';
      case 'eth_blockNumber':
        return '0x1';
      case 'eth_getBlockByNumber':
      case 'eth_getBlockByHash':
        return {
          number: '0x1',
          hash: BLOCK_HASH,
          timestamp: '0x1',
          transactions: [],
          miner: zeroAddress,
          parentHash: BLOCK_HASH,
          nonce: '0x0',
          sha3Uncles: BLOCK_HASH,
          logsBloom: `0x${'00'.repeat(256)}`,
          transactionsRoot: BLOCK_HASH,
          stateRoot: BLOCK_HASH,
          receiptsRoot: BLOCK_HASH,
          gasUsed: '0x1',
          gasLimit: '0x1',
          extraData: '0x',
          mixHash: BLOCK_HASH,
          difficulty: '0x0',
          totalDifficulty: '0x0',
          size: '0x1',
          uncles: [],
        };
      case 'eth_sendTransaction':
        return TX_HASH;
      case 'eth_getTransactionReceipt':
      case 'eth_getTransactionByHash':
        return successfulReceipt(CHECKSUM);
      default:
        throw new Error(`Unexpected RPC method in stub: ${method}`);
    }
  }

  beforeEach(() => {
    captured.length = 0;
    provider.request.mockClear();
    resetUpdateSealConfigCache();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (!url.includes('studio-dev.genlayer.com')) {
        throw new Error(`Stub refused non-Studio URL: ${url}`);
      }
      const body = JSON.parse(String(init?.body ?? '{}')) as { id?: unknown; method?: string; params?: unknown };
      try {
        const result = handleRpc(String(body.method), body.params);
        return new Response(JSON.stringify({ jsonrpc: '2.0', id: body.id ?? 1, result }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return new Response(
          JSON.stringify({ jsonrpc: '2.0', id: body.id ?? 1, error: { code: -32000, message } }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
    vi.restoreAllMocks();
  });

  it('uses the connected JSON-RPC account for fee simulation and wallet submission', async () => {
    const account = toGenLayerJsonRpcAccount(SENDER);
    const client = createWriteGenLayerClient(SENDER, provider);

    const estimate = await client.estimateTransactionFeesForWrite({
      account,
      address: CONTRACT,
      functionName: 'submit_candidate',
      args: ['pkg', '1.0.0', 'a'.repeat(40), 'https://example.invalid/e.json', 'b'.repeat(64)],
    });

    const hash = await client.writeContract({
      account,
      address: CONTRACT,
      functionName: 'submit_candidate',
      args: ['pkg', '1.0.0', 'a'.repeat(40), 'https://example.invalid/e.json', 'b'.repeat(64)],
      fees: {
        distribution: estimate.distribution,
        messageAllocations: estimate.messageAllocations,
        feeValue: estimate.feeValue,
      },
    });

    const feeFrom =
      captured.find((entry) => entry.method === 'sim_estimateTransactionFees')?.from ??
      captured.find((entry) => entry.method === 'gen_call')?.from;
    const estimateGasFrom = captured.find((entry) => entry.method === 'eth_estimateGas')?.from;
    const sendFrom = captured.find((entry) => entry.method === 'eth_sendTransaction')?.from;

    expect(feeFrom?.toLowerCase()).toBe(SENDER);
    expect(estimateGasFrom?.toLowerCase()).toBe(SENDER);
    expect(sendFrom?.toLowerCase()).toBe(SENDER);
    expect(feeFrom?.toLowerCase()).not.toBe(zeroAddress.toLowerCase());
    expect(sendFrom).not.toBeUndefined();
    expect(JSON.stringify(captured)).not.toMatch(/Address "undefined"/);
    expect(hash).toBe(TX_HASH);
    expect(vi.mocked(globalThis.fetch).mock.calls.length).toBeGreaterThan(0);
    for (const call of vi.mocked(globalThis.fetch).mock.calls) {
      expect(String(call[0])).toContain('studio-dev.genlayer.com');
    }
  });

  it('fails encoding when a plain string is passed as the SDK write account', async () => {
    const client = createClient({
      chain: studioDevnet,
      account: CHECKSUM,
      provider,
    });
    await expect(
      client.writeContract({
        account: SENDER as unknown as Account,
        address: CONTRACT,
        functionName: 'submit_candidate',
        args: ['pkg'],
      }),
    ).rejects.toThrow(/Address ["']undefined["'] is invalid|undefined/i);
  });
});
