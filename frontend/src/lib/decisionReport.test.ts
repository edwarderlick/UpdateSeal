import { describe, expect, it } from 'vitest';
import type { OnChainCandidateRecord, OnChainPackageRecord } from '../types/updateSeal';
import {
  inspectLiveDecision,
  isCompletedVerdictStatus,
  isValidDecisionHash,
  parseFindingCodesJson,
} from './decisionReport';

const PACKAGE: OnChainPackageRecord = {
  package_uid: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal',
  package_slug: 'updateseal',
  publisher: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407',
  repository_url: 'https://github.com/edwarderlick/UpdateSeal',
  baseline_commit_sha: 'b5d498fa08949e1e0f5113fb2f9d154368dfa97c',
  charter_json: '{}',
  charter_hash: 'c9fdc0131fe857370dd86b80b031cdc2a4520d492d891cd805e6900c10e8e959',
  sequence: 1,
};

function candidate(overrides: Partial<OnChainCandidateRecord> = {}): OnChainCandidateRecord {
  return {
    candidate_id: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal@0.1.0-v2-smoke',
    package_uid: PACKAGE.package_uid,
    version: '0.1.0-v2-smoke',
    candidate_commit_sha: 'd097c0e6ce20fdedd3bc86ab5d2e832e5d29d54f',
    evidence_uri:
      'https://raw.githubusercontent.com/edwarderlick/UpdateSeal/d097c0e6ce20fdedd3bc86ab5d2e832e5d29d54f/evidence/evidence-v2.json',
    evidence_hash: 'e0abffcfc03bcc53fb1a51094de1db934be9460a86d058e745efcb7180ff29ba',
    submitter: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407',
    status: 'APPROVED',
    decision_code: 1,
    decision_summary: 'No charter violations were found',
    evaluation_attempts: 1,
    finding_codes_json: '["NO_VIOLATION"]',
    decision_hash: 'c69ca06aa7f3b679600751df1fb7f6f11f1bcf1ec4e69e7173e5e45fffa80f97',
    ...overrides,
  };
}

describe('parseFindingCodesJson', () => {
  it('accepts a JSON array of non-empty strings', () => {
    expect(parseFindingCodesJson('["NO_VIOLATION"]')).toEqual({
      ok: true,
      codes: ['NO_VIOLATION'],
    });
  });

  it('rejects non-array JSON', () => {
    const result = parseFindingCodesJson('{"code":"NO_VIOLATION"}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.raw).toBe('{"code":"NO_VIOLATION"}');
    }
  });

  it('rejects comma-separated strings that are not a JSON array', () => {
    const result = parseFindingCodesJson('NO_VIOLATION,OTHER');
    expect(result.ok).toBe(false);
  });

  it('rejects arrays containing non-string entries', () => {
    const result = parseFindingCodesJson('[1,"NO_VIOLATION"]');
    expect(result.ok).toBe(false);
  });

  it('rejects arrays containing empty strings', () => {
    const result = parseFindingCodesJson('["NO_VIOLATION",""]');
    expect(result.ok).toBe(false);
  });

  it('does not silently replace malformed values with an empty list', () => {
    const result = parseFindingCodesJson('not-json');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.raw).toBe('not-json');
    }
  });
});

describe('isValidDecisionHash', () => {
  it('accepts exactly 64 lowercase hex characters', () => {
    expect(isValidDecisionHash('c69ca06aa7f3b679600751df1fb7f6f11f1bcf1ec4e69e7173e5e45fffa80f97')).toBe(
      true,
    );
  });

  it('rejects uppercase, missing, and incorrectly sized hashes', () => {
    expect(isValidDecisionHash('C69CA06AA7F3B679600751DF1FB7F6F11F1BCF1EC4E69E7173E5E45FFFA80F97')).toBe(
      false,
    );
    expect(isValidDecisionHash('')).toBe(false);
    expect(isValidDecisionHash('c69ca06aa7f3b679600751df1fb7f6f11f1bcf1ec4e69e7173e5e45fffa80f9')).toBe(
      false,
    );
    expect(isValidDecisionHash('c69ca06aa7f3b679600751df1fb7f6f11f1bcf1ec4e69e7173e5e45fffa80f9700')).toBe(
      false,
    );
  });
});

describe('inspectLiveDecision', () => {
  it('maps presentation from status, not decision_code', () => {
    const inspected = inspectLiveDecision(candidate({ status: 'VIOLATION', decision_code: 1 }), PACKAGE);
    expect(inspected.kind).toBe('verdict');
    if (inspected.kind === 'verdict') {
      expect(inspected.status).toBe('VIOLATION');
    }
    expect(isCompletedVerdictStatus('APPROVED')).toBe(true);
  });

  it('treats PENDING empty finding_codes_json and empty decision_hash as valid', () => {
    const inspected = inspectLiveDecision(
      candidate({
        status: 'PENDING',
        decision_code: 0,
        decision_summary: '',
        evaluation_attempts: 0,
        finding_codes_json: '',
        decision_hash: '',
      }),
      PACKAGE,
    );
    expect(inspected.kind).toBe('pending');
  });

  it('flags malformed finding codes on completed verdicts', () => {
    const inspected = inspectLiveDecision(candidate({ finding_codes_json: 'NO_VIOLATION' }), PACKAGE);
    expect(inspected.kind).toBe('integrity');
  });

  it('flags invalid decision hashes on completed verdicts', () => {
    const inspected = inspectLiveDecision(candidate({ decision_hash: '' }), PACKAGE);
    expect(inspected.kind).toBe('integrity');
  });

  it('flags unknown statuses as unsupported', () => {
    const inspected = inspectLiveDecision(candidate({ status: 'SEALED' }), PACKAGE);
    expect(inspected.kind).toBe('unsupported');
  });
});
