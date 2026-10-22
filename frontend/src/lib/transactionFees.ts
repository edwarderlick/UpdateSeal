import type { FeesDistribution, MessageFeeAllocationInput, TransactionFeeEstimate, TransactionFeeOptions } from 'genlayer-js/types';
import { UpdateSealError } from './updateSealErrors';

const GEN_DECIMALS = 18n;
const WEI_PER_GEN = 10n ** GEN_DECIMALS;

export const FEE_ESTIMATION_FAILED_MESSAGE = 'Fee estimation failed';

export interface ValidatedRegistrationFees {
  distribution: FeesDistribution;
  messageAllocations: MessageFeeAllocationInput[] | undefined;
  feeValue: bigint;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

export function toFeeWei(value: unknown): bigint | null {
  if (typeof value === 'bigint') {
    return value;
  }
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || !Number.isSafeInteger(value)) {
      return null;
    }
    return BigInt(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') {
      return null;
    }
    if (/^0x[0-9a-fA-F]+$/.test(trimmed) || /^-?\d+$/.test(trimmed)) {
      try {
        return BigInt(trimmed);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Formats wei as GEN using integer division only. */
export function formatGenFromWei(wei: bigint): string {
  const negative = wei < 0n;
  const absolute = negative ? -wei : wei;
  const whole = absolute / WEI_PER_GEN;
  const fraction = absolute % WEI_PER_GEN;
  const sign = negative ? '-' : '';
  if (fraction === 0n) {
    return `${sign}${whole.toString()} GEN`;
  }
  const fractionDigits = fraction.toString().padStart(18, '0').replace(/0+$/, '');
  return `${sign}${whole.toString()}.${fractionDigits} GEN`;
}

export function requireValidWriteFees(estimate: unknown): ValidatedRegistrationFees {
  const record = asRecord(estimate);
  if (!record) {
    throw new UpdateSealError('FEE_ESTIMATE_INVALID', FEE_ESTIMATION_FAILED_MESSAGE);
  }

  const distribution = record.distribution;
  if (!distribution || typeof distribution !== 'object' || Array.isArray(distribution)) {
    throw new UpdateSealError('FEE_ESTIMATE_INVALID', FEE_ESTIMATION_FAILED_MESSAGE);
  }

  const feeValue = toFeeWei(record.feeValue);
  if (feeValue === null || feeValue <= 0n) {
    throw new UpdateSealError('FEE_ESTIMATE_INVALID', FEE_ESTIMATION_FAILED_MESSAGE);
  }

  const messageAllocations = record.messageAllocations;
  if (messageAllocations !== undefined && !Array.isArray(messageAllocations)) {
    throw new UpdateSealError('FEE_ESTIMATE_INVALID', FEE_ESTIMATION_FAILED_MESSAGE);
  }

  return {
    distribution: distribution as FeesDistribution,
    messageAllocations: messageAllocations as MessageFeeAllocationInput[] | undefined,
    feeValue,
  };
}

export function toWriteContractFees(estimate: TransactionFeeEstimate | ValidatedRegistrationFees): TransactionFeeOptions {
  return {
    distribution: estimate.distribution,
    messageAllocations: estimate.messageAllocations,
    feeValue: estimate.feeValue,
  };
}
