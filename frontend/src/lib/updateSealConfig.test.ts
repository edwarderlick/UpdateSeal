import { describe, expect, it } from 'vitest';
import { parseUpdateSealConfig } from './updateSealConfig';
import { UpdateSealError } from './updateSealErrors';
import { VALID_LIVE_ENV } from '../test/updateSealFixtures';

describe('parseUpdateSealConfig', () => {
  it('1. accepts a valid live Studio-dev configuration', () => {
    const config = parseUpdateSealConfig(VALID_LIVE_ENV);
    expect(config.dataMode).toBe('live');
    expect(config.chainId).toBe(61997);
    expect(config.rpcUrl).toBe('https://studio-dev.genlayer.com/api');
    expect(config.contractAddress).toBe('0x6A882db328782051dFf05C40F4C34b3F223cd80A');
    expect(config.networkAlias).toBe('studio-dev');
    expect(Object.isFrozen(config)).toBe(true);
  });

  it('2. rejects an invalid contract address', () => {
    expect(() =>
      parseUpdateSealConfig({
        ...VALID_LIVE_ENV,
        VITE_UPDATESEAL_CONTRACT_ADDRESS: '0x1234',
      }),
    ).toThrow(UpdateSealError);
    try {
      parseUpdateSealConfig({
        ...VALID_LIVE_ENV,
        VITE_UPDATESEAL_CONTRACT_ADDRESS: '0x1234',
      });
    } catch (error) {
      expect(error).toBeInstanceOf(UpdateSealError);
      expect((error as UpdateSealError).code).toBe('CONFIG_INVALID');
    }
  });

  it('3. rejects a wrong chain ID', () => {
    expect(() =>
      parseUpdateSealConfig({
        ...VALID_LIVE_ENV,
        VITE_GENLAYER_CHAIN_ID: '1',
      }),
    ).toThrow(/61997/);
  });

  it('4. accepts only the exact canonical Studio-dev RPC URL', () => {
    const config = parseUpdateSealConfig({
      ...VALID_LIVE_ENV,
      VITE_GENLAYER_RPC_URL: '  https://studio-dev.genlayer.com/api  ',
    });
    expect(config.rpcUrl).toBe('https://studio-dev.genlayer.com/api');

    const rejected = [
      'http://studio-dev.genlayer.com/api',
      'https://user:secret@studio-dev.genlayer.com/api',
      'https://studio-dev.genlayer.com:8443/api',
      'https://studio-dev.genlayer.com/api/',
      'https://studio-dev.genlayer.com/v1',
      'https://studio-dev.genlayer.com/api?x=1',
      'https://studio-dev.genlayer.com/api#frag',
      'https://studio-next.genlayer.com/api',
      'https://evil.example/api',
    ];
    for (const rpcUrl of rejected) {
      expect(() =>
        parseUpdateSealConfig({
          ...VALID_LIVE_ENV,
          VITE_GENLAYER_RPC_URL: rpcUrl,
        }),
      ).toThrow(/exactly https:\/\/studio-dev\.genlayer\.com\/api/);
    }
  });

  it('5. rejects an unknown data mode', () => {
    expect(() =>
      parseUpdateSealConfig({
        ...VALID_LIVE_ENV,
        VITE_UPDATESEAL_DATA_MODE: 'staging',
      }),
    ).toThrow(/live" or "demo/);
  });
});
