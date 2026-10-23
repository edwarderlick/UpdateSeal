import { describe, expect, it } from 'vitest';
import { getAddress, zeroAddress, type Account, type Address } from 'viem';
import { UpdateSealError } from './updateSealErrors';
import { toGenLayerJsonRpcAccount } from './genlayerAccount';

const LOWERCASE = '0x82fde1090c2941e5d8742a944813ebfc09c91c12' as Address;
const CHECKSUM = getAddress(LOWERCASE);

function expectJsonRpcAccount(account: Account, input: Address): void {
  expect(account).toMatchObject({
    address: getAddress(input),
    type: 'json-rpc',
  });
  expect(account.address.toLowerCase()).toBe(input.toLowerCase());
  expect(account).not.toHaveProperty('signTransaction');
  expect(account).not.toHaveProperty('signMessage');
  expect(account).not.toHaveProperty('signTypedData');
  expect(account).not.toHaveProperty('privateKey');
  expect(account).not.toHaveProperty('source');
  expect(JSON.stringify(account)).not.toMatch(/private/i);
}

describe('toGenLayerJsonRpcAccount', () => {
  it('converts a valid lowercase address into a JSON-RPC Account', () => {
    const account = toGenLayerJsonRpcAccount(LOWERCASE);
    expectJsonRpcAccount(account, LOWERCASE);
  });

  it('converts a valid checksum address into a JSON-RPC Account', () => {
    const account = toGenLayerJsonRpcAccount(CHECKSUM);
    expectJsonRpcAccount(account, CHECKSUM);
    expect(account.address).toBe(CHECKSUM);
  });

  it('matches the input address case-insensitively', () => {
    const fromLower = toGenLayerJsonRpcAccount(LOWERCASE);
    const fromChecksum = toGenLayerJsonRpcAccount(CHECKSUM);
    expect(fromLower.address.toLowerCase()).toBe(fromChecksum.address.toLowerCase());
    expect(fromLower.type).toBe('json-rpc');
    expect(fromChecksum.type).toBe('json-rpc');
  });

  it('rejects a malformed address', () => {
    expect(() => toGenLayerJsonRpcAccount('0xnotanaddress' as Address)).toThrow(UpdateSealError);
    expect(() => toGenLayerJsonRpcAccount('0xnotanaddress' as Address)).toThrow(
      expect.objectContaining({ code: 'TRANSACTION_PREPARATION_FAILED' }),
    );
  });

  it('rejects an empty address', () => {
    expect(() => toGenLayerJsonRpcAccount('' as Address)).toThrow(
      expect.objectContaining({ code: 'TRANSACTION_PREPARATION_FAILED' }),
    );
  });

  it('rejects undefined at the application boundary', () => {
    expect(() => toGenLayerJsonRpcAccount(undefined as unknown as Address)).toThrow(
      expect.objectContaining({ code: 'TRANSACTION_PREPARATION_FAILED' }),
    );
  });

  it('does not create private-key or local signing fields', () => {
    const account = toGenLayerJsonRpcAccount(CHECKSUM);
    expect(account.type).toBe('json-rpc');
    expect(account.type).not.toBe('local');
    expect('signTransaction' in account).toBe(false);
  });

  it('never falls back to zeroAddress', () => {
    const account = toGenLayerJsonRpcAccount(LOWERCASE);
    expect(account.address.toLowerCase()).not.toBe(zeroAddress.toLowerCase());
    expect(() => toGenLayerJsonRpcAccount('0x' as Address)).toThrow(
      expect.objectContaining({ code: 'TRANSACTION_PREPARATION_FAILED' }),
    );
  });
});
