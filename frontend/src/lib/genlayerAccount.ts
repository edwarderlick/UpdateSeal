import type { Account, Address } from 'viem';
import { getAddress } from 'viem';
import { parseAccount } from 'viem/accounts';
import { UpdateSealError } from './updateSealErrors';

export const ACCOUNT_CONSTRUCTION_FAILED_MESSAGE = 'Unable to construct the connected wallet account.';
export const TRANSACTION_PREPARATION_FAILED_MESSAGE =
  'The wallet transaction could not be prepared. No transaction was submitted.';

function isLocalSigningAccount(account: Account): boolean {
  return (
    account.type === 'local' ||
    'signTransaction' in account ||
    'signMessage' in account ||
    'signTypedData' in account ||
    'source' in account
  );
}

export function toGenLayerJsonRpcAccount(address: Address): Account {
  if (typeof address !== 'string' || address.length === 0) {
    throw new UpdateSealError('TRANSACTION_PREPARATION_FAILED', ACCOUNT_CONSTRUCTION_FAILED_MESSAGE);
  }

  let normalized: Address;
  try {
    normalized = getAddress(address);
  } catch {
    throw new UpdateSealError('TRANSACTION_PREPARATION_FAILED', ACCOUNT_CONSTRUCTION_FAILED_MESSAGE);
  }

  const account = parseAccount(normalized);

  if (
    account.type !== 'json-rpc' ||
    !account.address ||
    account.address.toLowerCase() !== normalized.toLowerCase() ||
    isLocalSigningAccount(account)
  ) {
    throw new UpdateSealError('TRANSACTION_PREPARATION_FAILED', ACCOUNT_CONSTRUCTION_FAILED_MESSAGE);
  }

  return account;
}

export function assertJsonRpcWriteAccount(account: Account, sender: Address): void {
  if (
    account.type !== 'json-rpc' ||
    typeof account.address !== 'string' ||
    account.address.toLowerCase() !== sender.toLowerCase()
  ) {
    throw new UpdateSealError('TRANSACTION_PREPARATION_FAILED', TRANSACTION_PREPARATION_FAILED_MESSAGE);
  }
}
