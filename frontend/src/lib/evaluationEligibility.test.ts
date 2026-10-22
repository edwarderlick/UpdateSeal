import { describe, expect, it } from 'vitest';
import {
  getEvaluationAction,
  isCandidateEvaluationEligible,
  isEvaluableStatus,
  isTerminalEvaluationStatus,
  MAX_EVALUATION_ATTEMPTS,
  parseEvaluationAttempts,
} from './evaluationEligibility';

describe('evaluation eligibility', () => {
  it('mirrors the deployed contract maximum of 3 attempts', () => {
    expect(MAX_EVALUATION_ATTEMPTS).toBe(3);
  });

  it.each([0, 1, 2] as const)('PENDING attempts %s is eligible and maps to request', (attempts) => {
    expect(isCandidateEvaluationEligible('PENDING', attempts)).toBe(true);
    expect(getEvaluationAction('PENDING', attempts)).toBe('request');
  });

  it.each([0, 1, 2] as const)(
    'EVIDENCE_UNAVAILABLE attempts %s is eligible and maps to retry',
    (attempts) => {
      expect(isCandidateEvaluationEligible('EVIDENCE_UNAVAILABLE', attempts)).toBe(true);
      expect(getEvaluationAction('EVIDENCE_UNAVAILABLE', attempts)).toBe('retry');
    },
  );

  it('PENDING attempts 3 is blocked as attempts_exhausted', () => {
    expect(isCandidateEvaluationEligible('PENDING', 3)).toBe(false);
    expect(isEvaluableStatus('PENDING')).toBe(true);
    expect(getEvaluationAction('PENDING', 3)).toBe('attempts_exhausted');
  });

  it('PENDING attempts greater than 3 is blocked', () => {
    expect(isCandidateEvaluationEligible('PENDING', 4)).toBe(false);
    expect(getEvaluationAction('PENDING', 4)).toBe('attempts_exhausted');
  });

  it('EVIDENCE_UNAVAILABLE attempts 3 is blocked as attempts_exhausted', () => {
    expect(isCandidateEvaluationEligible('EVIDENCE_UNAVAILABLE', 3)).toBe(false);
    expect(getEvaluationAction('EVIDENCE_UNAVAILABLE', 3)).toBe('attempts_exhausted');
  });

  it.each(['APPROVED', 'REVIEW_REQUIRED', 'VIOLATION'] as const)(
    '%s is terminal at every attempt count',
    (status) => {
      for (const attempts of [0, 1, 2, 3, 99]) {
        expect(isCandidateEvaluationEligible(status, attempts)).toBe(false);
        expect(isTerminalEvaluationStatus(status)).toBe(true);
        expect(getEvaluationAction(status, attempts)).toBe('terminal');
      }
    },
  );

  it.each(['', 'UNKNOWN', 'pending', null, undefined] as const)(
    'unknown/malformed status %s is ineligible',
    (status) => {
      expect(isCandidateEvaluationEligible(status, 0)).toBe(false);
      expect(isTerminalEvaluationStatus(status)).toBe(false);
      expect(getEvaluationAction(status, 0)).toBe('unsupported');
    },
  );

  it('negative attempts are rejected as an integrity error', () => {
    expect(parseEvaluationAttempts(-1)).toBeNull();
    expect(isCandidateEvaluationEligible('PENDING', -1)).toBe(false);
    expect(getEvaluationAction('PENDING', -1)).toBe('integrity_error');
  });

  it('fractional attempts are rejected as an integrity error', () => {
    expect(parseEvaluationAttempts(1.5)).toBeNull();
    expect(isCandidateEvaluationEligible('PENDING', 1.5)).toBe(false);
    expect(getEvaluationAction('EVIDENCE_UNAVAILABLE', 2.2)).toBe('integrity_error');
  });

  it('NaN and Infinity attempts are rejected', () => {
    expect(isCandidateEvaluationEligible('PENDING', Number.NaN)).toBe(false);
    expect(isCandidateEvaluationEligible('PENDING', Number.POSITIVE_INFINITY)).toBe(false);
    expect(getEvaluationAction('PENDING', Number.NaN)).toBe('integrity_error');
    expect(getEvaluationAction('PENDING', Number.POSITIVE_INFINITY)).toBe('integrity_error');
  });

  it('string, null, and undefined attempts are rejected without coercion', () => {
    expect(isCandidateEvaluationEligible('PENDING', '2')).toBe(false);
    expect(isCandidateEvaluationEligible('PENDING', '0')).toBe(false);
    expect(isCandidateEvaluationEligible('PENDING', null)).toBe(false);
    expect(isCandidateEvaluationEligible('PENDING', undefined)).toBe(false);
    expect(getEvaluationAction('PENDING', '2')).toBe('integrity_error');
    expect(getEvaluationAction('PENDING', null)).toBe('integrity_error');
    expect(getEvaluationAction('PENDING', undefined)).toBe('integrity_error');
  });
});
