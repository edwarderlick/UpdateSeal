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
  | 'FEE_ESTIMATE_INVALID';

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

export function toUpdateSealError(error: unknown, fallbackCode: UpdateSealErrorCode = 'INDEX_READ_FAILED'): UpdateSealError {
  if (error instanceof UpdateSealError) {
    return error;
  }

  const raw = error instanceof Error ? error.message : String(error);
  const lower = raw.toLowerCase();
  if (
    lower.includes('fetch failed') ||
    lower.includes('failed to fetch') ||
    lower.includes('network') ||
    lower.includes('etimedout') ||
    lower.includes('econnreset') ||
    lower.includes('timeout')
  ) {
    return new UpdateSealError('RPC_UNAVAILABLE', 'Studio-dev RPC is unavailable. The registry could not be read.');
  }

  return new UpdateSealError(fallbackCode, 'On-chain registry read failed.');
}

export function logUpdateSealError(error: UpdateSealError): void {
  if (import.meta.env.DEV && import.meta.env.MODE !== 'test') {
    console.warn(`[UpdateSeal] ${error.code}: ${error.userMessage}`);
  }
}
