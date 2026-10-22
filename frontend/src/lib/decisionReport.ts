import type { OnChainCandidateRecord, OnChainPackageRecord } from '../types/updateSeal';

export const COMPLETED_VERDICT_STATUSES = [
  'APPROVED',
  'REVIEW_REQUIRED',
  'VIOLATION',
  'EVIDENCE_UNAVAILABLE',
] as const;

export type CompletedVerdictStatus = (typeof COMPLETED_VERDICT_STATUSES)[number];
export type SupportedCandidateStatus = CompletedVerdictStatus | 'PENDING';

export const DECISION_HASH_PATTERN = /^[0-9a-f]{64}$/;

export const ON_CHAIN_INTEGRITY_ERROR = 'On-chain data integrity error';

export type FindingCodesParseResult =
  | { ok: true; codes: readonly string[] }
  | { ok: false; reason: string; raw: string };

export type LiveDecisionInspection =
  | {
      kind: 'pending';
      status: 'PENDING';
      candidate: OnChainCandidateRecord;
      packageRecord: OnChainPackageRecord;
      findingCodes: readonly string[];
    }
  | {
      kind: 'verdict';
      status: CompletedVerdictStatus;
      candidate: OnChainCandidateRecord;
      packageRecord: OnChainPackageRecord;
      findingCodes: readonly string[];
    }
  | {
      kind: 'unsupported';
      status: string;
      candidate: OnChainCandidateRecord;
      packageRecord: OnChainPackageRecord;
      message: string;
    }
  | {
      kind: 'integrity';
      status: string;
      candidate: OnChainCandidateRecord;
      packageRecord: OnChainPackageRecord;
      message: string;
      rawMalformedValue?: string;
    };

export function isCompletedVerdictStatus(status: string): status is CompletedVerdictStatus {
  return (COMPLETED_VERDICT_STATUSES as readonly string[]).includes(status);
}

export function isSupportedCandidateStatus(status: string): status is SupportedCandidateStatus {
  return status === 'PENDING' || isCompletedVerdictStatus(status);
}

export function isValidDecisionHash(value: string): boolean {
  return DECISION_HASH_PATTERN.test(value);
}

export function parseFindingCodesJson(raw: string): FindingCodesParseResult {
  const source = raw ?? '';
  try {
    const parsed: unknown = JSON.parse(source);
    if (!Array.isArray(parsed)) {
      return {
        ok: false,
        reason: 'finding_codes_json must parse as a JSON array of non-empty strings.',
        raw: source,
      };
    }
    const codes: string[] = [];
    for (let index = 0; index < parsed.length; index += 1) {
      const entry = parsed[index];
      if (typeof entry !== 'string' || entry.length === 0) {
        return {
          ok: false,
          reason: `finding_codes_json[${index}] must be a non-empty string.`,
          raw: source,
        };
      }
      codes.push(entry);
    }
    return { ok: true, codes };
  } catch {
    return {
      ok: false,
      reason: 'finding_codes_json is not valid JSON.',
      raw: source,
    };
  }
}

export function safeExternalHref(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      return url.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function inspectLiveDecision(
  candidate: OnChainCandidateRecord,
  packageRecord: OnChainPackageRecord,
): LiveDecisionInspection {
  const status = candidate.status;

  if (!isSupportedCandidateStatus(status)) {
    return {
      kind: 'unsupported',
      status,
      candidate,
      packageRecord,
      message: `Unsupported candidate status "${status}". Presentation is selected from the on-chain status string only.`,
    };
  }

  const findings = parseFindingCodesForStatus(status, candidate.finding_codes_json);
  if (!findings.ok) {
    return {
      kind: 'integrity',
      status,
      candidate,
      packageRecord,
      message: findings.reason,
      rawMalformedValue: findings.raw,
    };
  }

  if (status === 'PENDING') {
    return {
      kind: 'pending',
      status,
      candidate,
      packageRecord,
      findingCodes: findings.codes,
    };
  }

  if (!isValidDecisionHash(candidate.decision_hash)) {
    return {
      kind: 'integrity',
      status,
      candidate,
      packageRecord,
      message:
        'decision_hash must be exactly 64 lowercase hexadecimal characters for an evaluated candidate.',
      rawMalformedValue: candidate.decision_hash,
    };
  }

  return {
    kind: 'verdict',
    status,
    candidate,
    packageRecord,
    findingCodes: findings.codes,
  };
}

function parseFindingCodesForStatus(status: SupportedCandidateStatus, raw: string): FindingCodesParseResult {
  if (status === 'PENDING' && raw.trim().length === 0) {
    return { ok: true, codes: [] };
  }
  return parseFindingCodesJson(raw);
}
