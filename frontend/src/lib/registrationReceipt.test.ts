import { describe, expect, it } from 'vitest';
import {
  classifyRegistrationReceipt,
  createPendingRegistrationSnapshot,
  extractReturnedPackageUid,
  verifyReadBackRecord,
} from './registrationReceipt';
import type { OnChainPackageRecord } from '../types/updateSeal';

const SENDER = '0x82fde1090c2941e5d8742a944813ebfc09c91c12' as const;
const TX_HASH = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as const;
const UID = `${SENDER}/sentinel-code-auditor`;

const snapshot = createPendingRegistrationSnapshot({
  transactionHash: TX_HASH,
  senderAddress: SENDER,
  packageSlug: 'sentinel-code-auditor',
  repositoryUrl: 'https://github.com/sentinel-sec/code-auditor',
  baselineCommitSha: '4f89a29e81bfa0021c38e9184b2910cbe8822910',
  canonicalCharterJson: '{"schema_version":1}',
});

function matchingRecord(overrides: Partial<OnChainPackageRecord> = {}): OnChainPackageRecord {
  return {
    package_uid: UID,
    package_slug: 'sentinel-code-auditor',
    publisher: SENDER,
    repository_url: snapshot.repositoryUrl,
    baseline_commit_sha: snapshot.baselineCommitSha,
    charter_json: snapshot.canonicalCharterJson,
    charter_hash: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    sequence: 0,
    ...overrides,
  };
}

function makeReceipt(overrides: Record<string, unknown> = {}) {
  return {
    statusName: 'FINALIZED',
    txExecutionResultName: 'FINISHED_WITH_RETURN',
    hash: TX_HASH,
    consensus_data: {
      leader_receipt: [
        {
          result: UID,
          execution_result: 'FINISHED_WITH_RETURN',
        },
      ],
    },
    ...overrides,
  };
}

describe('classifyRegistrationReceipt', () => {
  it('requires GenLayerJS isSuccessful: ACCEPTED/FINALIZED and FINISHED_WITH_RETURN', () => {
    expect(classifyRegistrationReceipt(makeReceipt()).kind).toBe('success');
    expect(classifyRegistrationReceipt(makeReceipt({ statusName: 'ACCEPTED' })).kind).toBe('success');
  });

  it('classifies terminal execution failure as contract_rejected', () => {
    expect(
      classifyRegistrationReceipt(
        makeReceipt({
          txExecutionResultName: 'FINISHED_WITH_ERROR',
          consensus_data: { leader_receipt: [{ error: 'already registered', execution_result: 'FINISHED_WITH_ERROR' }] },
        }),
      ).kind,
    ).toBe('contract_rejected');
  });

  it('classifies canceled consensus as contract_rejected', () => {
    expect(classifyRegistrationReceipt(makeReceipt({ statusName: 'CANCELED', txExecutionResultName: 'TIMEOUT' })).kind).toBe(
      'contract_rejected',
    );
  });

  it('classifies pending receipts as status_unknown', () => {
    expect(
      classifyRegistrationReceipt({
        statusName: 'PENDING',
        txExecutionResultName: 'NOT_VOTED',
        hash: TX_HASH,
      }).kind,
    ).toBe('status_unknown');
  });

  it('classifies malformed or unrecognized receipts as status_unknown', () => {
    expect(classifyRegistrationReceipt(null).kind).toBe('status_unknown');
    expect(classifyRegistrationReceipt(undefined).kind).toBe('status_unknown');
    expect(classifyRegistrationReceipt('not-a-receipt').kind).toBe('status_unknown');
    expect(classifyRegistrationReceipt({ hash: TX_HASH }).kind).toBe('status_unknown');
    expect(classifyRegistrationReceipt({ statusName: 'FINALIZED' }).kind).toBe('status_unknown');
  });
});

describe('verifyReadBackRecord', () => {
  it('accepts a matching on-chain record with a valid charter hash', () => {
    expect(verifyReadBackRecord(matchingRecord(), snapshot)).toEqual({ ok: true });
  });

  it('rejects publisher mismatch case-insensitively compared to the snapshot sender', () => {
    expect(verifyReadBackRecord(matchingRecord({ publisher: SENDER.toUpperCase() }), snapshot).ok).toBe(true);
    expect(
      verifyReadBackRecord(matchingRecord({ publisher: '0x1111111111111111111111111111111111111111' }), snapshot),
    ).toEqual({ ok: false, reason: 'publisher' });
  });

  it('rejects slug, repository, SHA, charter JSON, UID, and charter hash mismatches', () => {
    expect(verifyReadBackRecord(matchingRecord({ package_slug: 'other-slug' }), snapshot)).toEqual({
      ok: false,
      reason: 'package_slug',
    });
    expect(verifyReadBackRecord(matchingRecord({ repository_url: 'https://github.com/other/repo' }), snapshot)).toEqual({
      ok: false,
      reason: 'repository_url',
    });
    expect(verifyReadBackRecord(matchingRecord({ baseline_commit_sha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' }), snapshot)).toEqual({
      ok: false,
      reason: 'baseline_commit_sha',
    });
    expect(verifyReadBackRecord(matchingRecord({ charter_json: '{"schema_version":2}' }), snapshot)).toEqual({
      ok: false,
      reason: 'charter_json',
    });
    expect(verifyReadBackRecord(matchingRecord({ package_uid: `${SENDER}/other-slug` }), snapshot)).toEqual({
      ok: false,
      reason: 'package_uid',
    });
    expect(verifyReadBackRecord(matchingRecord({ charter_hash: 'ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789' }), snapshot)).toEqual({
      ok: false,
      reason: 'charter_hash',
    });
    expect(verifyReadBackRecord(matchingRecord({ charter_hash: 'abc' }), snapshot)).toEqual({
      ok: false,
      reason: 'charter_hash',
    });
  });
});

describe('createPendingRegistrationSnapshot', () => {
  it('freezes identity from the original sender and slug', () => {
    expect(snapshot.expectedPackageUid).toBe(UID);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(extractReturnedPackageUid(makeReceipt())).toBe(UID);
  });
});
