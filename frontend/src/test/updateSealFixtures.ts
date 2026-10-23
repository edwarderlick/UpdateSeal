import type { OnChainCandidateRecord, OnChainPackageRecord, RegistrySnapshot } from '../types/updateSeal';

export const VALID_LIVE_ENV = {
  VITE_GENLAYER_RPC_URL: 'https://studio-dev.genlayer.com/api',
  VITE_GENLAYER_CHAIN_ID: '61997',
  VITE_UPDATESEAL_CONTRACT_ADDRESS: '0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3',
  VITE_UPDATESEAL_DATA_MODE: 'live',
};

export const SMOKE_CHARTER_JSON = JSON.stringify({
  schema_version: 1,
  summary: 'Smoke-test charter for UpdateSealRegistry on Studio-dev.',
  allowed_capabilities: ['network_egress'],
  forbidden_capabilities: ['process_execution'],
  allowed_domains: ['github.com'],
  required_evidence: ['git_diff'],
  policy_text: 'Do not expand capabilities without a new charter.',
});

export const SMOKE_PACKAGE: OnChainPackageRecord = Object.freeze({
  package_uid: '0x1e47d7d7079fe4ad599b184559ffcdc56278fb54/updateseal-smoke',
  package_slug: 'updateseal-smoke',
  publisher: '0x1e47d7d7079fe4ad599b184559ffcdc56278fb54',
  repository_url: 'https://github.com/edwarderlick/Provider-Court',
  baseline_commit_sha: '3f278c3f80a657950873c26145ab1ef867d40af5',
  charter_json: SMOKE_CHARTER_JSON,
  charter_hash: '3827082a036312d53d7ea918fbbbad9e7de9ec4a180c03550b231524873c7f48',
  sequence: 0,
});

export const SAMPLE_CANDIDATE: OnChainCandidateRecord = Object.freeze({
  candidate_id: '0x1e47d7d7079fe4ad599b184559ffcdc56278fb54/updateseal-smoke/1.0.1',
  package_uid: SMOKE_PACKAGE.package_uid,
  version: '1.0.1',
  candidate_commit_sha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  evidence_uri: 'https://example.com/evidence.json',
  evidence_hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  submitter: '0x1e47d7d7079fe4ad599b184559ffcdc56278fb54',
  status: 'submitted',
  decision_code: 0,
  decision_summary: '',
  evaluation_attempts: 0,
  finding_codes_json: '[]',
  decision_hash: '',
});

export function makeSnapshot(overrides: Partial<RegistrySnapshot> = {}): RegistrySnapshot {
  return Object.freeze({
    packageCount: 1,
    candidateCount: 0,
    packages: Object.freeze([SMOKE_PACKAGE]),
    candidates: Object.freeze([]),
    truncatedPackages: false,
    truncatedCandidates: false,
    truncationWarning: null,
    ...overrides,
  });
}
