export type UpdateSealErrorCode =
  | 'CONFIG_INVALID'
  | 'RPC_UNAVAILABLE'
  | 'CONTRACT_NOT_FOUND'
  | 'CONTRACT_RESPONSE_INVALID'
  | 'CHARTER_JSON_INVALID'
  | 'INDEX_READ_FAILED'
  | 'WALLET_REQUIRED'
  | 'WRONG_NETWORK'
  | 'WALLET_REJECTED'
  | 'CONTRACT_REJECTED'
  | 'STATUS_UNKNOWN'
  | 'DUPLICATE_PACKAGE'
  | 'DUPLICATE_CANDIDATE'
  | 'WRONG_PUBLISHER'
  | 'SENDER_MISMATCH'
  | 'WRITE_DISABLED'
  | 'FEE_ESTIMATION_FAILED'
  | 'FEE_ESTIMATE_INVALID'
  | 'WALLET_DISCONNECTED'
  | 'INVALID_CANDIDATE_ID'
  | 'CANDIDATE_NOT_FOUND'
  | 'CANDIDATE_NOT_PENDING'
  | 'CANDIDATE_NOT_EVALUATABLE'
  | 'MAX_EVALUATION_ATTEMPTS'
  | 'EVALUATION_ALREADY_PENDING'
  | 'STALE_CONFIRMATION'
  | 'USER_REJECTED'
  | 'TRANSACTION_REJECTED'
  | 'TRANSACTION_PREPARATION_FAILED'
  | 'READBACK_MISMATCH'
  | 'DECISION_INTEGRITY_ERROR';

export class UpdateSealError extends Error {
  readonly code: UpdateSealErrorCode;
  readonly userMessage: string;
  readonly transactionHash: string | null;

  constructor(code: UpdateSealErrorCode, userMessage: string, transactionHash: string | null = null) {
    super(userMessage);
    this.name = 'UpdateSealError';
    this.code = code;
    this.userMessage = userMessage;
    this.transactionHash = transactionHash;
  }
}

export const STUDIO_DEV_RPC_UNAVAILABLE_MESSAGE =
  'Studio-dev RPC is temporarily unavailable or rate-limited.';

export function toUpdateSealError(error: unknown, fallbackCode: UpdateSealErrorCode = 'INDEX_READ_FAILED'): UpdateSealError {
  if (error instanceof UpdateSealError) {
    return error;
  }

  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();
  if (
    lower.includes('429') ||
    lower.includes('rate limit') ||
    lower.includes('rate-limit') ||
    lower.includes('too many requests')
  ) {
    return new UpdateSealError('RPC_UNAVAILABLE', STUDIO_DEV_RPC_UNAVAILABLE_MESSAGE);
  }
  if (
    lower.includes('fetch failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('etimedout') ||
    lower.includes('econnreset') ||
    lower.includes('timeout')
  ) {
    return new UpdateSealError('RPC_UNAVAILABLE', STUDIO_DEV_RPC_UNAVAILABLE_MESSAGE);
  }

  return new UpdateSealError(fallbackCode, 'On-chain registry read failed.');
}

export function logUpdateSealError(error: UpdateSealError): void {
  if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
    console.warn(`[UpdateSeal] ${error.code}: ${error.userMessage}`);
  }
}
