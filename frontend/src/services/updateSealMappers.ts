import { UpdateSealError } from '../lib/updateSealErrors';
import type {
  CharterParseResult,
  CharterV1,
  OnChainCandidateRecord,
  OnChainPackageRecord,
} from '../types/updateSeal';

export function normalizeUint(value: unknown, field: string): number {
  if (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) && value >= 0) {
    return value;
  }
  if (typeof value === 'bigint') {
    if (value < 0n) {
      throw new UpdateSealError('CONTRACT_RESPONSE_INVALID', `${field} must be a non-negative integer.`);
    }
    const asNumber = Number(value);
    if (!Number.isSafeInteger(asNumber)) {
      throw new UpdateSealError('CONTRACT_RESPONSE_INVALID', `${field} exceeds a safe integer.`);
    }
    return asNumber;
  }
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const asNumber = Number(value);
    if (!Number.isSafeInteger(asNumber)) {
      throw new UpdateSealError('CONTRACT_RESPONSE_INVALID', `${field} exceeds a safe integer.`);
    }
    return asNumber;
  }
  throw new UpdateSealError('CONTRACT_RESPONSE_INVALID', `${field} is not a valid integer.`);
}

export function normalizeString(value: unknown, field: string): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value === 'object' && 'toString' in value) {
    const text = String(value);
    if (text && text !== '[object Object]') {
      return text;
    }
  }
  throw new UpdateSealError('CONTRACT_RESPONSE_INVALID', `${field} is not a valid string.`);
}

export function normalizeAddress(value: unknown, field: string): string {
  const text = normalizeString(value, field);
  if (!/^0x[0-9a-fA-F]{40}$/.test(text)) {
    throw new UpdateSealError('CONTRACT_RESPONSE_INVALID', `${field} is not a valid address.`);
  }
  return text;
}

export function normalizeBoolean(value: unknown, field: string): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true' || value === 1 || value === 1n) {
    return true;
  }
  if (value === 'false' || value === 0 || value === 0n) {
    return false;
  }
  throw new UpdateSealError('CONTRACT_RESPONSE_INVALID', `${field} is not a valid boolean.`);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new UpdateSealError('CONTRACT_RESPONSE_INVALID', `${label} must be an object.`);
  }
  return value as Record<string, unknown>;
}

export function mapPackageRecord(value: unknown): OnChainPackageRecord {
  const record = requireRecord(value, 'Package record');
  return Object.freeze({
    package_uid: normalizeString(record.package_uid, 'package_uid'),
    package_slug: normalizeString(record.package_slug, 'package_slug'),
    publisher: normalizeAddress(record.publisher, 'publisher'),
    repository_url: normalizeString(record.repository_url, 'repository_url'),
    baseline_commit_sha: normalizeString(record.baseline_commit_sha, 'baseline_commit_sha'),
    charter_json: normalizeString(record.charter_json, 'charter_json'),
    charter_hash: normalizeString(record.charter_hash, 'charter_hash'),
    sequence: normalizeUint(record.sequence, 'sequence'),
  });
}

export function mapCandidateRecord(value: unknown): OnChainCandidateRecord {
  const record = requireRecord(value, 'Candidate record');
  return Object.freeze({
    candidate_id: normalizeString(record.candidate_id, 'candidate_id'),
    package_uid: normalizeString(record.package_uid, 'package_uid'),
    version: normalizeString(record.version, 'version'),
    candidate_commit_sha: normalizeString(record.candidate_commit_sha, 'candidate_commit_sha'),
    evidence_uri: normalizeString(record.evidence_uri, 'evidence_uri'),
    evidence_hash: normalizeString(record.evidence_hash, 'evidence_hash'),
    submitter: normalizeAddress(record.submitter, 'submitter'),
    status: normalizeString(record.status, 'status'),
    decision_code: normalizeUint(record.decision_code, 'decision_code'),
    decision_summary: normalizeString(record.decision_summary, 'decision_summary'),
    evaluation_attempts: normalizeUint(record.evaluation_attempts, 'evaluation_attempts'),
    finding_codes_json: normalizeString(record.finding_codes_json, 'finding_codes_json'),
    decision_hash: normalizeString(record.decision_hash, 'decision_hash'),
  });
}

function asStringArray(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) {
    throw new UpdateSealError('CHARTER_JSON_INVALID', `${field} must be an array of strings.`);
  }
  return value.map((entry, index) => {
    if (typeof entry !== 'string') {
      throw new UpdateSealError('CHARTER_JSON_INVALID', `${field}[${index}] must be a string.`);
    }
    return entry;
  });
}

export function parseCharterJson(charterJson: string): CharterParseResult {
  if (typeof charterJson !== 'string' || charterJson.trim().length === 0) {
    return { ok: false, message: 'Stored charter JSON is empty.' };
  }

  try {
    const parsed = JSON.parse(charterJson) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, message: 'Stored charter JSON is not an object.' };
    }
    const record = parsed as Record<string, unknown>;
    if (record.schema_version !== 1) {
      return { ok: false, message: 'Charter schema_version must be 1.' };
    }
    const charter: CharterV1 = {
      schema_version: 1,
      summary: typeof record.summary === 'string' ? record.summary : '',
      allowed_capabilities: asStringArray(record.allowed_capabilities, 'allowed_capabilities'),
      forbidden_capabilities: asStringArray(record.forbidden_capabilities, 'forbidden_capabilities'),
      allowed_domains: asStringArray(record.allowed_domains, 'allowed_domains'),
      required_evidence: asStringArray(record.required_evidence, 'required_evidence'),
      policy_text: typeof record.policy_text === 'string' ? record.policy_text : '',
    };
    if (typeof record.summary !== 'string' || typeof record.policy_text !== 'string') {
      return { ok: false, message: 'Charter summary and policy_text must be strings.' };
    }
    return { ok: true, charter };
  } catch (error) {
    if (error instanceof UpdateSealError && error.code === 'CHARTER_JSON_INVALID') {
      return { ok: false, message: error.userMessage };
    }
    return { ok: false, message: 'Stored charter JSON could not be parsed.' };
  }
}

export function livePackagePath(publisher: string, packageSlug: string): string {
  return `/packages/${encodeURIComponent(publisher)}/${encodeURIComponent(packageSlug)}`;
}

export function shortenHex(value: string, size = 10): string {
  if (value.length <= size + 3) {
    return value;
  }
  return `${value.slice(0, size)}…`;
}

export function candidateCountForPackage(
  packageUid: string,
  candidates: readonly { package_uid: string }[],
): number {
  return candidates.filter((candidate) => candidate.package_uid === packageUid).length;
}
