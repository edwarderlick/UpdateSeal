import { dumpsCanonical } from './canonicalJson';
import { sha256Hex } from './evidencePreflight';
import type { CompletedVerdictStatus, SupportedCandidateStatus } from './decisionReport';

export const DECISION_NAME_BY_CODE: Record<number, SupportedCandidateStatus> = {
  0: 'PENDING',
  1: 'APPROVED',
  2: 'REVIEW_REQUIRED',
  3: 'VIOLATION',
  4: 'EVIDENCE_UNAVAILABLE',
};

export interface DecisionHashPayload {
  readonly candidate_id: string;
  readonly charter_hash: string;
  readonly decision_code: number;
  readonly decision_name: string;
  readonly evidence_hash: string;
  readonly finding_codes: readonly string[];
  readonly summary: string;
}

export function canonicalDecisionPayload(payload: DecisionHashPayload): string {
  return dumpsCanonical({
    candidate_id: payload.candidate_id,
    charter_hash: payload.charter_hash,
    decision_code: payload.decision_code,
    decision_name: payload.decision_name,
    evidence_hash: payload.evidence_hash,
    finding_codes: payload.finding_codes,
    summary: payload.summary,
  });
}

export async function computeDecisionHash(payload: DecisionHashPayload): Promise<string> {
  const canonical = canonicalDecisionPayload(payload);
  return sha256Hex(new TextEncoder().encode(canonical));
}

export function decisionNameForCode(code: number): SupportedCandidateStatus | null {
  return DECISION_NAME_BY_CODE[code] ?? null;
}

export function statusMatchesDecisionCode(status: string, decisionCode: number): boolean {
  return decisionNameForCode(decisionCode) === status;
}

export function verifiedHeadline(status: CompletedVerdictStatus): string {
  if (status === 'APPROVED') {
    return 'VERIFIED — APPROVED';
  }
  if (status === 'REVIEW_REQUIRED') {
    return 'VERIFIED — REVIEW REQUIRED';
  }
  if (status === 'VIOLATION') {
    return 'VERIFIED — VIOLATION';
  }
  return 'VERIFIED — EVIDENCE UNAVAILABLE';
}
