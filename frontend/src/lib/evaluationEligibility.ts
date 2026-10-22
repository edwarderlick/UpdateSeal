export const EVALUABLE_CANDIDATE_STATUSES = ['PENDING', 'EVIDENCE_UNAVAILABLE'] as const;
export const TERMINAL_EVALUATION_STATUSES = ['APPROVED', 'REVIEW_REQUIRED', 'VIOLATION'] as const;

/**
 * Mirrors the deployed UpdateSealRegistry contract constant `MAX_EVALUATION_ATTEMPTS`.
 * The contract rejects `evaluate_candidate` when `evaluation_attempts >= 3`.
 */
export const MAX_EVALUATION_ATTEMPTS = 3;

export type EvaluableCandidateStatus = (typeof EVALUABLE_CANDIDATE_STATUSES)[number];
export type TerminalEvaluationStatus = (typeof TERMINAL_EVALUATION_STATUSES)[number];
export type EvaluationAction =
  | 'request'
  | 'retry'
  | 'terminal'
  | 'attempts_exhausted'
  | 'unsupported'
  | 'integrity_error';

export function isEvaluableStatus(status: unknown): status is EvaluableCandidateStatus {
  return status === 'PENDING' || status === 'EVIDENCE_UNAVAILABLE';
}

export function isTerminalEvaluationStatus(
  status: unknown,
): status is TerminalEvaluationStatus {
  return status === 'APPROVED' || status === 'REVIEW_REQUIRED' || status === 'VIOLATION';
}

/**
 * Accepts only an actual finite integer attempt count. Strings such as "2" are
 * rejected here; the contract mapper must convert on-chain values before this check.
 */
export function parseEvaluationAttempts(evaluationAttempts: unknown): number | null {
  if (typeof evaluationAttempts !== 'number') {
    return null;
  }
  if (!Number.isFinite(evaluationAttempts) || !Number.isInteger(evaluationAttempts)) {
    return null;
  }
  if (evaluationAttempts < 0) {
    return null;
  }
  return evaluationAttempts;
}

export function isCandidateEvaluationEligible(
  status: unknown,
  evaluationAttempts: unknown,
): boolean {
  if (!isEvaluableStatus(status)) {
    return false;
  }
  const attempts = parseEvaluationAttempts(evaluationAttempts);
  if (attempts === null) {
    return false;
  }
  return attempts < MAX_EVALUATION_ATTEMPTS;
}

export function getEvaluationAction(status: unknown, evaluationAttempts: unknown): EvaluationAction {
  if (isTerminalEvaluationStatus(status)) {
    return 'terminal';
  }
  if (!isEvaluableStatus(status)) {
    return 'unsupported';
  }
  const attempts = parseEvaluationAttempts(evaluationAttempts);
  if (attempts === null) {
    return 'integrity_error';
  }
  if (attempts >= MAX_EVALUATION_ATTEMPTS) {
    return 'attempts_exhausted';
  }
  if (status === 'PENDING') {
    return 'request';
  }
  return 'retry';
}

export function maxEvaluationAttemptsUserMessage(): string {
  return `Maximum evaluation attempts reached. The deployed contract permits at most ${MAX_EVALUATION_ATTEMPTS} attempts for this candidate.`;
}
