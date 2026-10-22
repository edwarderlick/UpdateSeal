import type { OnChainCandidateRecord, OnChainPackageRecord } from '../types/updateSeal';
import { getUpdateSealConfig } from './updateSealConfig';
import { UpdateSealError } from './updateSealErrors';
import {
  inspectLiveDecision,
  isValidDecisionHash,
  ON_CHAIN_INTEGRITY_ERROR,
  type CompletedVerdictStatus,
} from './decisionReport';
import { computeDecisionHash, statusMatchesDecisionCode, verifiedHeadline } from './decisionHash';
import {
  EVIDENCE_BODY_MAX,
  parseRawGithubEvidence,
  validateEvidenceMatchesPackage,
} from './candidateValidation';
import { sha256Hex } from './evidencePreflight';
import {
  candidateExists,
  getCandidate,
  getCandidateId,
  getPackage,
} from '../services/updateSealContract';

export type VerifyLookupInput = {
  mode: 'candidate' | 'package';
  candidateId: string;
  packageUid: string;
  version: string;
};

export type EvidenceBytesOutcome =
  | { status: 'verified'; message: 'Evidence bytes verified'; computedHash: string }
  | { status: 'mismatch'; message: 'Evidence hash mismatch'; computedHash: string }
  | { status: 'unavailable'; message: 'Evidence unavailable'; detail: string }
  | { status: 'url_integrity'; message: 'Evidence URL integrity error'; detail: string };

export interface MachineReadableVerification {
  network: string;
  chain_id: number;
  contract_address: string;
  package_uid: string;
  candidate_id: string;
  repository_url: string;
  baseline_commit_sha: string;
  candidate_commit_sha: string;
  status: string;
  decision_code: number;
  decision_summary: string;
  finding_codes: readonly string[];
  charter_hash: string;
  evidence_uri: string;
  evidence_hash: string;
  decision_hash: string;
  decision_hash_verified: boolean;
  evidence_bytes_verified: boolean | null;
  evaluation_attempts: number;
}

export type VerifyReleaseResult =
  | {
      outcome: 'not_found';
      headline: 'RELEASE NOT FOUND';
      requestedId: string;
    }
  | {
      outcome: 'integrity';
      headline: 'ON-CHAIN DATA INTEGRITY ERROR';
      message: string;
      rawMalformedValue?: string;
      candidate?: OnChainCandidateRecord;
      packageRecord?: OnChainPackageRecord;
    }
  | {
      outcome: 'pending';
      headline: 'PENDING — NO FINAL DECISION';
      candidate: OnChainCandidateRecord;
      packageRecord: OnChainPackageRecord;
      findingCodes: readonly string[];
      decisionHashVerified: false;
      machine: MachineReadableVerification;
    }
  | {
      outcome: 'verified';
      headline: ReturnType<typeof verifiedHeadline>;
      status: CompletedVerdictStatus;
      candidate: OnChainCandidateRecord;
      packageRecord: OnChainPackageRecord;
      findingCodes: readonly string[];
      decisionHashVerified: true;
      machine: MachineReadableVerification;
    };

function integrity(
  message: string,
  extras: Partial<Extract<VerifyReleaseResult, { outcome: 'integrity' }>> = {},
): VerifyReleaseResult {
  return {
    outcome: 'integrity',
    headline: 'ON-CHAIN DATA INTEGRITY ERROR',
    message,
    ...extras,
  };
}

export function assembleMachineReadableResult(args: {
  candidate: OnChainCandidateRecord;
  packageRecord: OnChainPackageRecord;
  findingCodes: readonly string[];
  decisionHashVerified: boolean;
  evidenceBytesVerified: boolean | null;
}): MachineReadableVerification {
  const config = getUpdateSealConfig();
  return {
    network: config.networkAlias,
    chain_id: config.chainId,
    contract_address: config.contractAddress,
    package_uid: args.candidate.package_uid,
    candidate_id: args.candidate.candidate_id,
    repository_url: args.packageRecord.repository_url,
    baseline_commit_sha: args.packageRecord.baseline_commit_sha,
    candidate_commit_sha: args.candidate.candidate_commit_sha,
    status: args.candidate.status,
    decision_code: args.candidate.decision_code,
    decision_summary: args.candidate.decision_summary,
    finding_codes: args.findingCodes,
    charter_hash: args.packageRecord.charter_hash,
    evidence_uri: args.candidate.evidence_uri,
    evidence_hash: args.candidate.evidence_hash,
    decision_hash: args.candidate.decision_hash,
    decision_hash_verified: args.decisionHashVerified,
    evidence_bytes_verified: args.evidenceBytesVerified,
    evaluation_attempts: args.candidate.evaluation_attempts,
  };
}

export function stringifyMachineReadableResult(machine: MachineReadableVerification): string {
  return JSON.stringify(machine, null, 2);
}

export async function verifyLiveRelease(input: VerifyLookupInput): Promise<VerifyReleaseResult> {
  let resolvedId = input.candidateId;
  if (input.mode === 'package') {
    resolvedId = await getCandidateId(input.packageUid, input.version);
    if (resolvedId !== input.candidateId) {
      return integrity('get_candidate_id did not match the derived candidate ID.');
    }
  }

  const exists = await candidateExists(resolvedId);
  if (!exists) {
    return { outcome: 'not_found', headline: 'RELEASE NOT FOUND', requestedId: resolvedId };
  }

  let candidate: OnChainCandidateRecord;
  try {
    candidate = await getCandidate(resolvedId);
  } catch (error) {
    if (error instanceof UpdateSealError && error.code === 'CONTRACT_NOT_FOUND') {
      return { outcome: 'not_found', headline: 'RELEASE NOT FOUND', requestedId: resolvedId };
    }
    throw error;
  }

  let packageRecord: OnChainPackageRecord;
  try {
    packageRecord = await getPackage(candidate.package_uid);
  } catch (error) {
    if (error instanceof UpdateSealError && error.code === 'CONTRACT_NOT_FOUND') {
      return integrity('Associated package was not found for this candidate.', { candidate });
    }
    throw error;
  }

  return inspectRetrievedRelease(candidate, packageRecord, {
    candidateId: resolvedId,
    version: input.version,
    packageUid: input.packageUid,
  });
}

export async function inspectRetrievedRelease(
  candidate: OnChainCandidateRecord,
  packageRecord: OnChainPackageRecord,
  expected: { candidateId: string; version: string; packageUid: string },
): Promise<VerifyReleaseResult> {
  if (candidate.package_uid !== packageRecord.package_uid) {
    return integrity('Candidate package UID does not match the loaded package.', {
      candidate,
      packageRecord,
    });
  }
  if (candidate.package_uid !== expected.packageUid) {
    return integrity('Requested package UID does not match the on-chain candidate.', {
      candidate,
      packageRecord,
    });
  }
  if (candidate.candidate_id !== expected.candidateId) {
    return integrity('Resolved candidate ID does not match the returned candidate ID.', {
      candidate,
      packageRecord,
    });
  }
  if (candidate.version !== expected.version) {
    return integrity('Requested version does not match the returned candidate version.', {
      candidate,
      packageRecord,
    });
  }
  if (!isValidDecisionHash(candidate.evidence_hash)) {
    return integrity('evidence_hash must be exactly 64 lowercase hexadecimal characters.', {
      candidate,
      packageRecord,
      rawMalformedValue: candidate.evidence_hash,
    });
  }
  if (!isValidDecisionHash(packageRecord.charter_hash)) {
    return integrity('charter_hash must be exactly 64 lowercase hexadecimal characters.', {
      candidate,
      packageRecord,
      rawMalformedValue: packageRecord.charter_hash,
    });
  }
  if (!statusMatchesDecisionCode(candidate.status, candidate.decision_code)) {
    return integrity('On-chain status does not match decision_code.', { candidate, packageRecord });
  }

  const inspection = inspectLiveDecision(candidate, packageRecord);
  if (inspection.kind === 'unsupported' || inspection.kind === 'integrity') {
    return integrity(
      inspection.kind === 'integrity' ? inspection.message : inspection.message,
      {
        candidate,
        packageRecord,
        rawMalformedValue: inspection.kind === 'integrity' ? inspection.rawMalformedValue : candidate.status,
      },
    );
  }

  if (inspection.kind === 'pending') {
    return {
      outcome: 'pending',
      headline: 'PENDING — NO FINAL DECISION',
      candidate,
      packageRecord,
      findingCodes: inspection.findingCodes,
      decisionHashVerified: false,
      machine: assembleMachineReadableResult({
        candidate,
        packageRecord,
        findingCodes: inspection.findingCodes,
        decisionHashVerified: false,
        evidenceBytesVerified: null,
      }),
    };
  }

  const recomputed = await computeDecisionHash({
    candidate_id: candidate.candidate_id,
    charter_hash: packageRecord.charter_hash,
    decision_code: candidate.decision_code,
    decision_name: candidate.status,
    evidence_hash: candidate.evidence_hash,
    finding_codes: inspection.findingCodes,
    summary: candidate.decision_summary,
  });
  if (recomputed !== candidate.decision_hash) {
    return integrity('Recomputed decision hash does not match the stored decision_hash.', {
      candidate,
      packageRecord,
      rawMalformedValue: candidate.decision_hash,
    });
  }

  return {
    outcome: 'verified',
    headline: verifiedHeadline(inspection.status),
    status: inspection.status,
    candidate,
    packageRecord,
    findingCodes: inspection.findingCodes,
    decisionHashVerified: true,
    machine: assembleMachineReadableResult({
      candidate,
      packageRecord,
      findingCodes: inspection.findingCodes,
      decisionHashVerified: true,
      evidenceBytesVerified: null,
    }),
  };
}

export async function verifyEvidenceBytes(args: {
  evidenceUri: string;
  evidenceHash: string;
  repositoryUrl: string;
  candidateCommitSha: string;
  fetchFn?: typeof fetch;
  sha256HexFn?: (bytes: Uint8Array) => Promise<string>;
}): Promise<EvidenceBytesOutcome> {
  const parsed = parseRawGithubEvidence(args.evidenceUri);
  if (!parsed.ok) {
    return { status: 'url_integrity', message: 'Evidence URL integrity error', detail: parsed.message };
  }
  const matchError = validateEvidenceMatchesPackage(
    args.evidenceUri,
    args.repositoryUrl,
    args.candidateCommitSha,
  );
  if (matchError) {
    return { status: 'url_integrity', message: 'Evidence URL integrity error', detail: matchError };
  }

  const fetchFn = args.fetchFn ?? fetch;
  let response: Response;
  try {
    response = await fetchFn(args.evidenceUri, {
      method: 'GET',
      credentials: 'omit',
      redirect: 'follow',
    });
  } catch {
    return {
      status: 'unavailable',
      message: 'Evidence unavailable',
      detail: 'Evidence URI could not be fetched.',
    };
  }
  if (response.status !== 200) {
    return {
      status: 'unavailable',
      message: 'Evidence unavailable',
      detail: `Evidence URI returned HTTP ${response.status}. HTTP 200 is required.`,
    };
  }

  const reader = response.body?.getReader();
  if (!reader) {
    const buffer = new Uint8Array(await response.arrayBuffer());
    if (buffer.byteLength > EVIDENCE_BODY_MAX) {
      return {
        status: 'unavailable',
        message: 'Evidence unavailable',
        detail: 'Evidence body exceeds the 100,000-byte cap.',
      };
    }
    return compareEvidenceHash(buffer, args.evidenceHash, args.sha256HexFn);
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (!value) {
      continue;
    }
    total += value.byteLength;
    if (total > EVIDENCE_BODY_MAX) {
      await reader.cancel();
      return {
        status: 'unavailable',
        message: 'Evidence unavailable',
        detail: 'Evidence body exceeds the 100,000-byte cap.',
      };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return compareEvidenceHash(bytes, args.evidenceHash, args.sha256HexFn);
}

async function compareEvidenceHash(
  bytes: Uint8Array,
  expected: string,
  sha256HexFn?: (bytes: Uint8Array) => Promise<string>,
): Promise<EvidenceBytesOutcome> {
  const hashFn = sha256HexFn ?? sha256Hex;
  const computedHash = await hashFn(bytes);
  if (computedHash === expected) {
    return { status: 'verified', message: 'Evidence bytes verified', computedHash };
  }
  return { status: 'mismatch', message: 'Evidence hash mismatch', computedHash };
}

export { ON_CHAIN_INTEGRITY_ERROR };
