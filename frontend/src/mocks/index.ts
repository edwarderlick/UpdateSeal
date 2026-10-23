import {
  Package,
  ReleaseDecision,
  ActivityEvent,
  CapabilityBoundary,
  Release,
} from '../types';

/**
 * UpdateSeal Mock Data Store
 * All hashes, public addresses, and consensus votes are simulated local mock/demo data.
 * These do NOT represent real on-chain assets or live GenLayer Studio Next transactions.
 */

export const MOCK_OWNER_WALLET = '0x82fDe1090c2941E5D8742A944813EbFc09C91C12';
export const MOCK_CORE_CONTRACT = 'Contract integration pending';
export const MOCK_CHAIN_ID = 61997;

export const DEFAULT_ATLAS_CHARTER: CapabilityBoundary = {
  network_egress: {
    policy: 'ALLOWED_WITH_LIMITS',
    description: 'Outbound HTTP/HTTPS requests restricted to verified LLM API providers and public scientific indices.',
    allowedDomains: ['api.anthropic.com', 'api.genlayer.io', 'arxiv.org'],
    allowRawIps: false,
  },
  file_system: {
    policy: 'ALLOWED_WITH_LIMITS',
    description: 'Sandboxed directory tree. Host root, ssh credentials, and environment keys are strictly forbidden.',
    jailedPaths: ['/tmp/workspace/*', './data/cache/*'],
    prohibitedTargets: ['/etc/*', '~/.ssh/*', '~/.aws/*'],
  },
  process_execution: {
    policy: 'PROHIBITED',
    description: 'Zero runtime process forks, terminal subshells, or child_process invocations.',
    allowChildProcesses: false,
  },
  cryptographic_signing: {
    policy: 'PROHIBITED',
    description: 'Airgapped execution. Agent holds no private keys and cannot sign transactions autonomously.',
    airgapped: true,
  },
  spending_limits: {
    policy: 'ALLOWED_WITH_LIMITS',
    description: 'Epoch spending allowance strictly capped at 10 GEN per 24 hours under intelligent contract rules.',
    maxGenPer24h: 10,
  },
  external_data_export: {
    policy: 'ALLOWED_WITH_LIMITS',
    description: 'Encrypted webhook payloads transmitted only to registered orchestrator endpoint.',
    encryptionRequired: true,
    restrictedOrchestratorOnly: true,
  },
};

export const MOCK_DECISIONS: Record<string, ReleaseDecision> = {
  approved: {
    code: '0x01',
    title: 'Candidate Release Approved (Demo Record)',
    verdictLabel: '0x01 Approved',
    summary:
      'All 5 independent GenLayer LLM evaluator validator nodes reached full deterministic consensus. Zero undeclared system primitives, capability breaches, or outbound egress escalations were identified across candidate AST analysis.',
    details:
      'Candidate release v1.4.2 satisfies all 6 immutable boundary charter conditions. Verified against frozen capability charter (Demo Record).',
    heroBgClass: 'bg-brand-vibrantCyan text-brand-charcoal',
    accentBadgeClass: 'bg-brand-forest text-brand-pastelYellow',
    consensusVote: '5/5 Unanimous Affirmative',
    timestamp: '2025-02-28 14:02:18 UTC',
    blockNumber: 61997401,
    txHash: '0x98ef519a48bb29c019488a19891c98492019488a',
    evaluatorModel: 'GEN-LLM-CONSENSUS-V4',
  },
  'review-required': {
    code: '0x02',
    title: 'Governance Escalation: Human Review Concept (Design Demo)',
    verdictLabel: '0x02 Review Required',
    summary:
      'Candidate diff touches sensitive boundary thresholds or newly declared domain endpoints that exceed automated threshold parameters. Illustrative copy: human operators review outside this contract.',
    details:
      'Illustrative validator copy identified 1 new egress domain (api.mistral.ai). UpdateSealRegistry v1 does not implement DAO multisig ratification. External systems may consume a live REVIEW_REQUIRED verdict.',
    heroBgClass: 'bg-brand-pastelYellow text-brand-charcoal',
    accentBadgeClass: 'bg-brand-charcoal text-brand-pastelYellow',
    consensusVote: '3/5 Flagged for Review',
    timestamp: '2025-02-28 15:45:02 UTC',
    blockNumber: 61997415,
    txHash: '0x48bb9120bc918412891c98492019488a19891c32',
    evaluatorModel: 'GEN-LLM-CONSENSUS-V4',
  },
  'capability-violation': {
    code: '0x03',
    title: 'Release Blocked: Undeclared Capability Detected',
    verdictLabel: '0x03 Capability Violation',
    summary:
      'Candidate v1.5.0 attempted to introduce shell process execution and connect to an unwhitelisted external domain. The candidate has been rejected by GenLayer validator consensus. The approved canonical release remains locked at v1.4.2.',
    details:
      '2 critical boundary breaches detected in AST analysis: child_process.spawn invocation in src/runners/process_exec.ts, and undeclared telemetry egress to https://telemetry-collect-xyz.net/metrics.',
    heroBgClass: 'bg-brand-orange text-white',
    accentBadgeClass: 'bg-brand-charcoal text-brand-pastelYellow',
    consensusVote: '5/5 Rejection Confirmed',
    timestamp: '2025-02-28 16:12:44 UTC',
    blockNumber: 61997402,
    txHash: '0x78ab499120bc918412891c98492019488a19891c',
    evaluatorModel: 'GEN-LLM-CONSENSUS-V4',
  },
  'evidence-unavailable': {
    code: '0x04',
    title: 'Consensus Aborted: Upstream Evidence Unavailable',
    verdictLabel: '0x04 Evidence Unavailable',
    summary:
      'Upstream Git commit tree or compiler artifacts could not be fetched or verified by validator enclaves within the round timeout window. Release is quarantined.',
    details:
      'GitHub API returned 404 or repository tag was moved during evaluation round. Candidate cannot be verified without verifiable cryptographic source trees.',
    heroBgClass: 'bg-stone-300 text-brand-charcoal',
    accentBadgeClass: 'bg-brand-charcoal text-white',
    consensusVote: '0/5 Quorum Timed Out',
    timestamp: '2025-02-28 17:30:10 UTC',
    blockNumber: 61997428,
    txHash: '0x19488a19891c98492019488a0x78ab499120bc9184',
    evaluatorModel: 'GEN-LLM-CONSENSUS-V4',
  },
};

export const MOCK_ATLAS_RELEASES: Release[] = [
  {
    id: 'rel-atlas-150',
    packageId: 'atlas-research-agent',
    version: 'v1.5.0',
    commitSha: 'd9b2e04f81c9a72b6c31048f9024cbb4901f4a9c',
    submittedAt: '2025-02-28 16:08:12 UTC',
    status: 'REJECTED',
    decisionCode: '0x03',
    validatorQuorum: '5 of 5 Consensus',
    diffSummary: '2 boundary violations detected (+1 process spawn, +1 unwhitelisted domain)',
    decisionReportPath: '/decisions/capability-violation',
    evidenceChecks: [
      {
        id: 'ev-1',
        category: 'process_execution',
        label: 'Zero Process Execution Prohibition',
        status: 'FAILED',
        details: 'Violation 01: src/runners/process_exec.ts:L42 introduces child_process.spawn("curl", [targetUrl]).',
        diffExtract: {
          file: 'src/runners/process_exec.ts',
          line: 42,
          code: "+const proc = child_process.spawn('curl', [targetUrl]);",
          isAddition: true,
        },
      },
      {
        id: 'ev-2',
        category: 'network_egress',
        label: 'Declared Network Egress Whitelist',
        status: 'FAILED',
        details: 'Violation 02: src/network/client.ts:L88 attempts POST fetch to undeclared domain https://telemetry-collect-xyz.net/metrics.',
        diffExtract: {
          file: 'src/network/client.ts',
          line: 88,
          code: '+  const telemetryHost = "https://telemetry-collect-xyz.net/metrics";',
          isAddition: true,
        },
      },
      {
        id: 'ev-3',
        category: 'file_system',
        label: 'Filesystem Sandboxing Compliance',
        status: 'PASSED',
        details: 'All disk reads/writes confined to jailed paths /tmp/workspace/* and ./data/cache/*.',
      },
      {
        id: 'ev-4',
        category: 'cryptographic_signing',
        label: 'Airgapped Key Signature Verification',
        status: 'PASSED',
        details: 'No private keys or signing calls detected in candidate bytecode.',
      },
    ],
  },
  {
    id: 'rel-atlas-142',
    packageId: 'atlas-research-agent',
    version: 'v1.4.2',
    commitSha: '4f89a29e81bfa0021c38e9184b2910cbe8822910',
    submittedAt: '2025-02-28 13:58:00 UTC',
    status: 'SEALED',
    decisionCode: '0x01',
    validatorQuorum: '5 of 5 Consensus',
    diffSummary: 'Full boundary compliance, 0 diff escalations',
    decisionReportPath: '/decisions/approved',
    evidenceChecks: [
      {
        id: 'ev-142-1',
        category: 'network_egress',
        label: 'Declared Network Egress Whitelist',
        status: 'PASSED',
        details: 'Only connections to api.anthropic.com and arxiv.org.',
      },
      {
        id: 'ev-142-2',
        category: 'process_execution',
        label: 'Process Execution Rules',
        status: 'PASSED',
        details: 'Pure WASM memory routines; zero OS exec.',
      },
    ],
  },
];

export const MOCK_PACKAGES: Package[] = [
  {
    id: 'atlas-research-agent',
    name: 'atlas-research-agent',
    displayName: 'Atlas Research Agent',
    description: 'Autonomous algorithmic research daemon with sovereign WebSearch and recursive tool invocation hooks. Candidate commits evaluated against strict charter rules.',
    ownerWallet: MOCK_OWNER_WALLET,
    repositoryUrl: 'https://github.com/atlas-protocol/research-agent',
    baselineVersion: 'v1.4.2',
    baselineCommitSha: '4f89a29e81bfa0021c38e9184b2910cbe8822910',
    latestCandidateVersion: 'v1.5.0',
    latestCandidateCommitSha: 'd9b2e04f81c9a72b6c31048f9024cbb4901f4a9c',
    status: 'SEALED',
    capabilityCharter: DEFAULT_ATLAS_CHARTER,
    activeDecisionCode: '0x01',
    tags: ['RESEARCH', 'AUTONOMOUS', 'LLM-ORCHESTRATION'],
    releases: MOCK_ATLAS_RELEASES,
    stars: 342,
    verifiedAt: '2025-02-28 14:02:18 UTC',
    charterCanonicalId: 'CHARTER-ATLAS-V1',
    charterMerkleRoot: '0x78ab4991c0e9f2b848558a120092bfda194c721',
  },
  {
    id: 'sentinel-code-auditor',
    name: 'sentinel-code-auditor',
    displayName: 'Sentinel Code Auditor',
    description: 'Autonomous smart-contract static analysis agent executing deep symbolic evaluation on EVM bytecodes.',
    ownerWallet: '0x39fAa4091c0e8124991b10cbe8822910c920119f',
    repositoryUrl: 'https://github.com/sentinel-sec/code-auditor',
    baselineVersion: 'v2.1.0',
    baselineCommitSha: '9a8b1c4f81c9a72b6c31048f9024cbb4901f3100',
    status: 'SEALED',
    capabilityCharter: {
      ...DEFAULT_ATLAS_CHARTER,
      network_egress: {
        policy: 'PROHIBITED',
        description: 'Complete airgap. Offline static AST analysis only.',
        allowedDomains: [],
      },
    },
    activeDecisionCode: '0x01',
    tags: ['SECURITY', 'AUDIT', 'STATIC-ANALYSIS'],
    releases: [],
    stars: 512,
    verifiedAt: '2025-02-27 10:15:30 UTC',
    charterCanonicalId: 'CHARTER-SENTINEL-V2',
    charterMerkleRoot: '0x11029ba87192bc9124a98e219ba48810c920119f',
  },
  {
    id: 'chronos-time-oracle',
    name: 'chronos-time-oracle',
    displayName: 'Chronos Time Oracle',
    description: 'High-frequency deterministic timestamp coordinator providing tamper-proof calendar pulses to autonomous agents.',
    ownerWallet: '0xb44192ba87123aa9e18bca4872910cbe8822910c',
    repositoryUrl: 'https://github.com/chronos-org/time-oracle',
    baselineVersion: 'v0.9.4',
    baselineCommitSha: '12ce9ff81c9a72b6c31048f9024cbb4901f9999',
    latestCandidateVersion: 'v1.0.0-rc2',
    latestCandidateCommitSha: 'e81c9a72b6c31048f9024cbb4901f999912ce9ff',
    status: 'REVIEW_REQUIRED',
    capabilityCharter: DEFAULT_ATLAS_CHARTER,
    activeDecisionCode: '0x02',
    tags: ['ORACLE', 'INFRASTRUCTURE', 'GOVERNANCE'],
    releases: [],
    stars: 189,
    verifiedAt: '2025-02-26 18:20:00 UTC',
    charterCanonicalId: 'CHARTER-CHRONOS-V0',
    charterMerkleRoot: '0xd84192ba87123aa9e18bca4872910cbe8822910',
  },
  {
    id: 'quanta-arbitrage-bot',
    name: 'quanta-arbitrage-bot',
    displayName: 'Quanta Arbitrage Bot',
    description: 'Cross-DEX liquidity rebalancing agent with strict 5 GEN transaction size limits and multi-sig fail-safes.',
    ownerWallet: '0x12ce9ff39fa4091c0e8124991b10cbe8822910c9',
    repositoryUrl: 'https://github.com/quanta-dex/arbitrage-bot',
    baselineVersion: 'v1.1.2',
    baselineCommitSha: '44192ba87123aa9e18bca4872910cbe8822910cc',
    status: 'REJECTED',
    capabilityCharter: {
      ...DEFAULT_ATLAS_CHARTER,
      spending_limits: {
        policy: 'ALLOWED_WITH_LIMITS',
        maxGenPer24h: 5,
      },
    },
    activeDecisionCode: '0x03',
    tags: ['FINANCE', 'DEFI', 'HIGH-FREQUENCY'],
    releases: [],
    stars: 275,
    verifiedAt: '2025-02-25 11:00:15 UTC',
    charterCanonicalId: 'CHARTER-QUANTA-V1',
    charterMerkleRoot: '0x99e881c120bc918412891c98492019488a19891c',
  },
];

export const MOCK_ACTIVITY: ActivityEvent[] = [
  {
    id: 'act-01',
    timestamp: '2025-02-28 16:12:44 UTC',
    type: 'RELEASE_BLOCKED',
    packageId: 'atlas-research-agent',
    packageName: 'Atlas Research Agent',
    version: 'v1.5.0',
    decisionCode: '0x03',
    txHash: '0x78ab499120bc918412891c98492019488a19891c',
    actor: 'GenLayer Consensus Enclave',
    summary: 'Candidate v1.5.0 blocked: 2 capability breaches detected. Baseline remains v1.4.2.',
    blockNumber: 61997402,
  },
  {
    id: 'act-02',
    timestamp: '2025-02-28 16:08:12 UTC',
    type: 'CANDIDATE_SUBMITTED',
    packageId: 'atlas-research-agent',
    packageName: 'Atlas Research Agent',
    version: 'v1.5.0',
    txHash: 'demo-tx-0x9c4f1090c2941e5d8742a944813ebfc09c91c120',
    actor: MOCK_OWNER_WALLET,
    summary: 'Candidate commit d9b2e04f... staged for consensus evaluation.',
    blockNumber: 61997395,
  },
  {
    id: 'act-03',
    timestamp: '2025-02-28 15:45:02 UTC',
    type: 'REVIEW_REQUESTED',
    packageId: 'chronos-time-oracle',
    packageName: 'Chronos Time Oracle',
    version: 'v1.0.0-rc2',
    decisionCode: '0x02',
    txHash: '0x48bb9120bc918412891c98492019488a19891c32',
    actor: 'GenLayer Consensus Enclave',
    summary: 'Candidate touches privileged boundary thresholds. Quorum escalation requested.',
    blockNumber: 61997415,
  },
  {
    id: 'act-04',
    timestamp: '2025-02-28 14:02:18 UTC',
    type: 'RELEASE_APPROVED',
    packageId: 'atlas-research-agent',
    packageName: 'Atlas Research Agent',
    version: 'v1.4.2',
    decisionCode: '0x01',
    txHash: '0x98ef519a48bb29c019488a19891c98492019488a',
    actor: 'GenLayer Consensus Enclave',
    summary: 'Candidate v1.4.2 validated with 5/5 validator quorum (Demo Record).',
    blockNumber: 61997401,
  },
  {
    id: 'act-05',
    timestamp: '2025-02-27 10:15:30 UTC',
    type: 'PACKAGE_REGISTERED',
    packageId: 'sentinel-code-auditor',
    packageName: 'Sentinel Code Auditor',
    version: 'v2.1.0',
    decisionCode: '0x01',
    txHash: '0x39fa1090c2941e5d8742a944813ebfc09c91c120',
    actor: '0x39fAa4091c0e8124991b10cbe8822910c920119f',
    summary: 'Package registered with Airgapped Static Charter standard.',
    blockNumber: 61996800,
  },
];

export const mockPackages = MOCK_PACKAGES;
export const mockDecisions = MOCK_DECISIONS;
export const mockActivityEvents = MOCK_ACTIVITY;
export const mockAtlasReleases = MOCK_ATLAS_RELEASES;
