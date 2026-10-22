import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createClient } = vi.hoisted(() => ({
  createClient: vi.fn(() => ({
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

import {
  getGenLayerClientCreateCountForTests,
  getReadOnlyGenLayerClient,
  resetGenLayerClientForTests,
} from './genlayerClient';
import { resetUpdateSealConfigCache } from './updateSealConfig';

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
