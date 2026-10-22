export type DecisionCode = '0x01' | '0x02' | '0x03' | '0x04';

export type ReleaseStatus = 
  | 'SEALED' 
  | 'EVALUATING' 
  | 'REJECTED' 
  | 'REVIEW_REQUIRED' 
  | 'STAGED_PENDING_TX';

export type CapabilityCategory = 
  | 'network_egress'
  | 'file_system'
  | 'process_execution'
  | 'cryptographic_signing'
  | 'spending_limits'
  | 'external_data_export';

export type CapabilityPolicy = 
  | 'PROHIBITED' 
  | 'ALLOWED_WITH_LIMITS' 
  | 'UNRESTRICTED';

export interface CapabilityBoundaryRule {
  policy: CapabilityPolicy;
  description?: string;
  allowedDomains?: string[];
  allowRawIps?: boolean;
  jailedPaths?: string[];
  prohibitedTargets?: string[];
  allowChildProcesses?: boolean;
  airgapped?: boolean;
  maxGenPer24h?: number;
  encryptionRequired?: boolean;
  restrictedOrchestratorOnly?: boolean;
}

export interface CapabilityBoundary {
  network_egress: CapabilityBoundaryRule;
  file_system: CapabilityBoundaryRule;
  process_execution: CapabilityBoundaryRule;
  cryptographic_signing: CapabilityBoundaryRule;
  spending_limits: CapabilityBoundaryRule;
  external_data_export: CapabilityBoundaryRule;
}

export interface EvidenceCheck {
  id: string;
  category: CapabilityCategory;
  label: string;
  status: 'PASSED' | 'FAILED' | 'FLAGGED' | 'UNAVAILABLE';
  details: string;
  diffExtract?: {
    file: string;
    line: number;
    code: string;
    isAddition: boolean;
  };
}

export interface ReleaseDecision {
  code: DecisionCode;
  title: string;
  verdictLabel: string;
  summary: string;
  details: string;
  heroBgClass: string;
  accentBadgeClass: string;
  consensusVote: string;
  timestamp: string;
  blockNumber: number;
  txHash: string;
  evaluatorModel: string;
}

export interface Release {
  id: string;
  packageId: string;
  version: string;
  commitSha: string;
  submittedAt: string;
  status: ReleaseStatus;
  decisionCode: DecisionCode;
  validatorQuorum: string;
  diffSummary?: string;
  evidenceChecks: EvidenceCheck[];
  decisionReportPath: string;
}

export interface Package {
  id: string;
  name: string;
  displayName: string;
  description: string;
  ownerWallet: string;
  repositoryUrl: string;
  baselineVersion: string;
  baselineCommitSha: string;
  latestCandidateVersion?: string;
  latestCandidateCommitSha?: string;
  status: ReleaseStatus;
  capabilityCharter: CapabilityBoundary;
  activeDecisionCode: DecisionCode;
  tags: string[];
  releases: Release[];
  stars: number;
  verifiedAt: string;
  charterCanonicalId: string;
  charterMerkleRoot: string;
}

export type TransactionStatus = 
  | 'IDLE'
  | 'AWAITING_SIGNATURE'
  | 'SUBMITTED'
  | 'CONSENSUS_PENDING'
  | 'FINALIZED'
  | 'CONTRACT_ERROR'
  | 'WALLET_REJECTED';

export interface TransactionLifecycle {
  status: TransactionStatus;
  txHash?: string;
  blockNumber?: number;
  errorMessage?: string;
  step: number;
  stageLabel: string;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  providerName: string | null;
  balanceGen: string;
  chainId: number;
}

export interface NetworkState {
  chainId: number;
  networkName: string;
  rpcUrl: string;
  currencySymbol: string;
  isCorrectNetwork: boolean;
}

export type ActivityEventType = 
  | 'PACKAGE_REGISTERED'
  | 'CANDIDATE_SUBMITTED'
  | 'CONSENSUS_FINALIZED'
  | 'RELEASE_APPROVED'
  | 'RELEASE_BLOCKED'
  | 'REVIEW_REQUESTED';

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: ActivityEventType;
  packageId: string;
  packageName: string;
  version: string;
  decisionCode?: DecisionCode;
  txHash: string;
  actor: string;
  summary: string;
  blockNumber: number;
  blockHeight?: number;
  commitSha?: string;
  quorum?: string;
  decisionReportRoute?: string;
}
