import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn((..._args: unknown[]) => ({
    readContract: vi.fn(),
    waitForTransactionReceipt: vi.fn(),
    writeContract: vi.fn(),
  })),
}));

vi.mock('genlayer-js', () => ({
  createClient,
}));

vi.mock('genlayer-js/chains', () => ({
  studioDevnet: { id: 61997, name: 'studioDevnet' },
}));

import { getAddress } from 'viem';
import {
  createWriteGenLayerClient,
  getGenLayerClientCreateCountForTests,
  getReadOnlyGenLayerClient,
  resetGenLayerClientForTests,
} from './genlayerClient';
import { resetUpdateSealConfigCache } from './updateSealConfig';
import { UpdateSealError } from './updateSealErrors';

describe('getReadOnlyGenLayerClient', () => {
  beforeEach(() => {
    resetGenLayerClientForTests();
    resetUpdateSealConfigCache();
    createClient.mockClear();
  });

  it('6. lazily creates a single read-only Studio-dev client', () => {
    const first = getReadOnlyGenLayerClient();
    const second = getReadOnlyGenLayerClient();
    expect(first).toBe(second);
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith({
      chain: { id: 61997, name: 'studioDevnet' },
    });
    expect(getGenLayerClientCreateCountForTests()).toBe(1);
    expect(first).not.toHaveProperty('account');
  });
});

describe('createWriteGenLayerClient', () => {
  const SENDER = '0x82fde1090c2941e5d8742a944813ebfc09c91c12' as const;
  const OTHER = '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407' as const;
  const provider = { request: vi.fn() };

  beforeEach(() => {
    resetGenLayerClientForTests();
    resetUpdateSealConfigCache();
    createClient.mockClear();
  });

  it('converts the connected address to a JSON-RPC account then binds createClient to that checksummed address', () => {
    createWriteGenLayerClient(SENDER, provider);
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith({
      chain: { id: 61997, name: 'studioDevnet' },
      account: getAddress(SENDER),
      provider,
    });
    const firstCall = createClient.mock.calls[0]?.[0] as { account?: unknown } | undefined;
    expect(typeof firstCall?.account).toBe('string');
  });

  it('binds a new client when the connected wallet changes', () => {
    createWriteGenLayerClient(SENDER, provider);
    createWriteGenLayerClient(OTHER, provider);
    expect(createClient).toHaveBeenCalledTimes(2);
    const firstAccount = (createClient.mock.calls[0]?.[0] as { account?: unknown } | undefined)?.account;
    const secondAccount = (createClient.mock.calls[1]?.[0] as { account?: unknown } | undefined)?.account;
    expect(firstAccount).toBe(getAddress(SENDER));
    expect(secondAccount).toBe(getAddress(OTHER));
  });

  it('rejects invalid account construction before createClient', () => {
    expect(() => createWriteGenLayerClient('0xnotanaddress' as `0x${string}`, provider)).toThrow(UpdateSealError);
    expect(createClient).not.toHaveBeenCalled();
  });
});
