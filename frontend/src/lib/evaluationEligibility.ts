export const EVALUABLE_CANDIDATE_STATUSES = ['PENDING', 'EVIDENCE_UNAVAILABLE'] as const;
export const TERMINAL_EVALUATION_STATUSES = ['APPROVED', 'REVIEW_REQUIRED', 'VIOLATION'] as const;

export type EvaluableCandidateStatus = (typeof EVALUABLE_CANDIDATE_STATUSES)[number];
export type TerminalEvaluationStatus = (typeof TERMINAL_EVALUATION_STATUSES)[number];
export type EvaluationAction = 'request' | 'retry' | 'terminal' | 'unsupported';

export function isCandidateEvaluationEligible(
  status: string | null | undefined,
): status is EvaluableCandidateStatus {
  return status === 'PENDING' || status === 'EVIDENCE_UNAVAILABLE';
}

export function isTerminalEvaluationStatus(
  status: string | null | undefined,
): status is TerminalEvaluationStatus {
  return status === 'APPROVED' || status === 'REVIEW_REQUIRED' || status === 'VIOLATION';
}

export function getEvaluationAction(status: string | null | undefined): EvaluationAction {
  if (status === 'PENDING') {
    return 'request';
  }
  if (status === 'EVIDENCE_UNAVAILABLE') {
    return 'retry';
  }
  if (isTerminalEvaluationStatus(status)) {
    return 'terminal';
  }
  return 'unsupported';
}
