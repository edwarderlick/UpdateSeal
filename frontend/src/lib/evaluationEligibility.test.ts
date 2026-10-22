import { describe, expect, it } from 'vitest';
import {
  getEvaluationAction,
  isCandidateEvaluationEligible,
  isTerminalEvaluationStatus,
} from './evaluationEligibility';

describe('evaluation eligibility', () => {
  it('PENDING is eligible and maps to request', () => {
    expect(isCandidateEvaluationEligible('PENDING')).toBe(true);
    expect(getEvaluationAction('PENDING')).toBe('request');
  });

  it('EVIDENCE_UNAVAILABLE is eligible and maps to retry', () => {
    expect(isCandidateEvaluationEligible('EVIDENCE_UNAVAILABLE')).toBe(true);
    expect(getEvaluationAction('EVIDENCE_UNAVAILABLE')).toBe('retry');
  });

  it.each(['APPROVED', 'REVIEW_REQUIRED', 'VIOLATION'] as const)('%s is terminal', (status) => {
    expect(isCandidateEvaluationEligible(status)).toBe(false);
    expect(isTerminalEvaluationStatus(status)).toBe(true);
    expect(getEvaluationAction(status)).toBe('terminal');
  });

  it.each(['', 'UNKNOWN', 'pending', null, undefined] as const)(
    'unknown/malformed status %s is ineligible',
    (status) => {
      expect(isCandidateEvaluationEligible(status)).toBe(false);
      expect(isTerminalEvaluationStatus(status)).toBe(false);
      expect(getEvaluationAction(status)).toBe('unsupported');
    },
  );
});
