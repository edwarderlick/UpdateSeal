export interface OnChainPackageRecord {
  package_uid: string;
  package_slug: string;
  publisher: string;
  repository_url: string;
  baseline_commit_sha: string;
  charter_json: string;
  charter_hash: string;
  sequence: number;
}

export interface OnChainCandidateRecord {
  candidate_id: string;
  package_uid: string;
  version: string;
  candidate_commit_sha: string;
  evidence_uri: string;
  evidence_hash: string;
  submitter: string;
  status: string;
  decision_code: number;
  decision_summary: string;
  evaluation_attempts: number;
  finding_codes_json: string;
  decision_hash: string;
}

export interface CharterV1 {
  schema_version: 1;
  summary: string;
  allowed_capabilities: string[];
  forbidden_capabilities: string[];
  allowed_domains: string[];
  required_evidence: string[];
  policy_text: string;
}

export type CharterParseResult =
  | { ok: true; charter: CharterV1 }
  | { ok: false; message: string };

export interface RegistrySnapshot {
  packageCount: number;
  candidateCount: number;
  packages: readonly OnChainPackageRecord[];
  candidates: readonly OnChainCandidateRecord[];
  truncatedPackages: boolean;
  truncatedCandidates: boolean;
  truncationWarning: string | null;
}

export const MAX_REGISTRY_PACKAGES = 200;
export const MAX_REGISTRY_CANDIDATES = 500;
export const MAX_READ_CONCURRENCY = 4;

export interface RegisterPackageParams {
  packageSlug: string;
  repositoryUrl: string;
  baselineCommitSha: string;
  charterJson: string;
  senderAddress: `0x${string}`;
}

export interface RegisterPackageSuccess {
  transactionHash: `0x${string}`;
  packageUid: string;
  record: OnChainPackageRecord;
  consensusStatus: 'ACCEPTED' | 'FINALIZED';
}

export type RegisterProgressPhase =
  | 'estimating_fees'
  | 'awaiting_wallet'
  | 'submitted'
  | 'waiting_consensus';

export interface PendingRegistrationSnapshot {
  readonly transactionHash: `0x${string}`;
  readonly senderAddress: `0x${string}`;
  readonly packageSlug: string;
  readonly expectedPackageUid: string;
  readonly repositoryUrl: string;
  readonly baselineCommitSha: string;
  readonly canonicalCharterJson: string;
}

export interface RegisterProgress {
  phase: RegisterProgressPhase;
  transactionHash?: `0x${string}`;
  snapshot?: PendingRegistrationSnapshot;
  estimatedFeeWei?: bigint;
  estimatedFeeLabel?: string;
}

export interface SubmitCandidateParams {
  packageUid: string;
  version: string;
  candidateCommitSha: string;
  evidenceUri: string;
  evidenceHash: string;
  senderAddress: `0x${string}`;
  expectedCandidateId: string;
}

export interface SubmitCandidateSuccess {
  transactionHash: `0x${string}`;
  candidateId: string;
  record: OnChainCandidateRecord;
  consensusStatus: 'ACCEPTED' | 'FINALIZED';
}

export type SubmitCandidateProgressPhase =
  | 'estimating_fees'
  | 'awaiting_wallet'
  | 'submitted'
  | 'waiting_consensus';

export interface PendingCandidateSnapshot {
  readonly transactionHash: `0x${string}`;
  readonly senderAddress: `0x${string}`;
  readonly packageUid: string;
  readonly expectedCandidateId: string;
  readonly version: string;
  readonly candidateCommitSha: string;
  readonly evidenceUri: string;
  readonly evidenceHash: string;
}

export interface SubmitCandidateProgress {
  phase: SubmitCandidateProgressPhase;
  transactionHash?: `0x${string}`;
  snapshot?: PendingCandidateSnapshot;
  estimatedFeeWei?: bigint;
  estimatedFeeLabel?: string;
}
