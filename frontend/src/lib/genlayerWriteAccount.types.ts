import type { Account } from 'viem';

// Compile-time regression: genlayer-js@2.0.0-rc.1 write/estimate account must be a Viem Account.
// @ts-expect-error plain strings are not valid GenLayer write accounts
const invalidGenLayerWriteAccount: Account = '0x82fde1090c2941e5d8742a944813ebfc09c91c12';

void invalidGenLayerWriteAccount;
