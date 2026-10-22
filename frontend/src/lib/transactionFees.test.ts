import { describe, expect, it } from 'vitest';
import { formatGenFromWei, requireValidWriteFees, toFeeWei, toWriteContractFees } from './transactionFees';
import { UpdateSealError } from './updateSealErrors';

const distribution = {
  leaderTimeunitsAllocation: 1n,
  validatorTimeunitsAllocation: 2n,
  appealRounds: 3n,
  executionBudgetPerRound: 4n,
  executionConsumed: 0n,
  totalMessageFees: 5n,
  rotations: [1n, 2n],
  maxPriceGenPerTimeUnit: 6n,
  storageFeeMaxGasPrice: 7n,
  receiptFeeMaxGasPrice: 8n,
};

describe('formatGenFromWei', () => {
  it('formats whole GEN without a decimal point', () => {
    expect(formatGenFromWei(1_000_000_000_000_000_000n)).toBe('1 GEN');
    expect(formatGenFromWei(0n)).toBe('0 GEN');
  });

  it('formats fractional GEN with integer arithmetic only', () => {
    expect(formatGenFromWei(1n)).toBe('0.000000000000000001 GEN');
    expect(formatGenFromWei(123_450_000_000_000_000n)).toBe('0.12345 GEN');
  });
});

describe('requireValidWriteFees', () => {
  it('accepts a positive bigint feeValue and present distribution', () => {
    const messageAllocations = [{ messageType: 0 as const, recipient: '0x0000000000000000000000000000000000000001' as const }];
    const fees = requireValidWriteFees({
      distribution,
      messageAllocations,
      feeValue: 42n,
    });
    expect(fees.feeValue).toBe(42n);
    expect(fees.distribution).toBe(distribution);
    expect(fees.messageAllocations).toBe(messageAllocations);
    expect(toWriteContractFees(fees)).toEqual({
      distribution,
      messageAllocations,
      feeValue: 42n,
    });
  });

  it('converts a decimal string feeValue to bigint', () => {
    expect(toFeeWei('1000000000000000000')).toBe(1_000_000_000_000_000_000n);
    const fees = requireValidWriteFees({ distribution, feeValue: '1000000000000000000' });
    expect(fees.feeValue).toBe(1_000_000_000_000_000_000n);
  });

  it('rejects zero, missing, and malformed estimates', () => {
    expect(() => requireValidWriteFees({ distribution, feeValue: 0n })).toThrow(UpdateSealError);
    expect(() => requireValidWriteFees({ feeValue: 1n })).toThrow(UpdateSealError);
    expect(() => requireValidWriteFees({ distribution: 'nope', feeValue: 1n })).toThrow(UpdateSealError);
    expect(() => requireValidWriteFees({ distribution, feeValue: 1.5 })).toThrow(UpdateSealError);
    try {
      requireValidWriteFees({ distribution, feeValue: 0n });
    } catch (error) {
      expect(error).toMatchObject({ code: 'FEE_ESTIMATE_INVALID', transactionHash: null });
    }
  });
});
