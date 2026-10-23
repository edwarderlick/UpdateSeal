import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { registryQueryKeys } from '../features/registry/registryQueryKeys';
import { OFFICIAL_UPDATESEAL_PACKAGE_UID, knownPackageLabelText } from './registryLabels';
import type { OnChainCandidateRecord, OnChainPackageRecord } from '../types/updateSeal';

const {
  getCandidate,
  getCandidateCount,
  getCandidateIdAt,
  getPackage,
  getPackageCount,
  getPackageUidAt,
} = vi.hoisted(() => ({
  getCandidate: vi.fn(),
  getCandidateCount: vi.fn(),
  getCandidateIdAt: vi.fn(),
  getPackage: vi.fn(),
  getPackageCount: vi.fn(),
  getPackageUidAt: vi.fn(),
}));

vi.mock('../services/updateSealContract', async () => {
  const actual = await vi.importActual<typeof import('../services/updateSealContract')>(
    '../services/updateSealContract',
  );
  return {
    ...actual,
    getCandidate,
    getCandidateCount,
    getCandidateIdAt,
    getPackage,
    getPackageCount,
    getPackageUidAt,
  };
});

import {
  INITIAL_ENUMERATION_CURSOR,
  inspectIndexedCandidate,
  loadCandidatePage,
  loadPackagePage,
  mergeIndexedById,
  REGISTRY_PAGE_SIZE,
} from './registryEnumeration';

const OFFICIAL: OnChainPackageRecord = {
  package_uid: OFFICIAL_UPDATESEAL_PACKAGE_UID,
  package_slug: 'updateseal',
  publisher: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407',
  repository_url: 'https://github.com/edwarderlick/UpdateSeal',
  baseline_commit_sha: 'b5d498fa08949e1e0f5113fb2f9d154368dfa97c',
  charter_json: '{}',
  charter_hash: 'c9fdc0131fe857370dd86b80b031cdc2a4520d492d891cd805e6900c10e8e959',
  sequence: 1,
};

const LEGACY: OnChainPackageRecord = {
  package_uid: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal-v2-e2e',
  package_slug: 'updateseal-v2-e2e',
  publisher: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407',
  repository_url: 'https://github.com/edwarderlick/Provider-Court',
  baseline_commit_sha: '3f278c3f80a657950873c26145ab1ef867d40af5',
  charter_json: '{}',
  charter_hash: '69591b822164cdc2aa5015e5acdc140f4271c7642d00bc7526b969e5d5705270',
  sequence: 0,
};

const APPROVED: OnChainCandidateRecord = {
  candidate_id: `${OFFICIAL_UPDATESEAL_PACKAGE_UID}@0.1.0-v2-smoke`,
  package_uid: OFFICIAL_UPDATESEAL_PACKAGE_UID,
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
};

describe('registry enumeration', () => {
  beforeEach(() => {
    getCandidate.mockReset();
    getCandidateCount.mockReset();
    getCandidateIdAt.mockReset();
    getPackage.mockReset();
    getPackageCount.mockReset();
    getPackageUidAt.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('paginates package_count through package_uid_at and get_package', async () => {
    getPackageCount.mockResolvedValue(2);
    getPackageUidAt.mockImplementation(async (index: number) => (index === 0 ? LEGACY.package_uid : OFFICIAL.package_uid));
    getPackage.mockImplementation(async (uid: string) => (uid === OFFICIAL.package_uid ? OFFICIAL : LEGACY));
    const page = await loadPackagePage(INITIAL_ENUMERATION_CURSOR);
    expect(page.totalCount).toBe(2);
    expect(page.items[0]?.kind === 'ok' && page.items[0].index === 1).toBe(true);
    expect(page.nextCursor).toBeNull();
    expect(REGISTRY_PAGE_SIZE).toBe(20);
  });

  it('paginates candidate_count through candidate_id_at and get_candidate', async () => {
    getCandidateCount.mockResolvedValue(1);
    getCandidateIdAt.mockResolvedValue(APPROVED.candidate_id);
    getCandidate.mockResolvedValue(APPROVED);
    const page = await loadCandidatePage(INITIAL_ENUMERATION_CURSOR);
    expect(page.totalCount).toBe(1);
    expect(page.items[0]?.kind).toBe('ok');
  });

  it('never exceeds 4 simultaneous contract reads', async () => {
    getPackageCount.mockResolvedValue(8);
    let inflight = 0;
    let max = 0;
    const track = async <T,>(work: () => Promise<T>): Promise<T> => {
      inflight += 1;
      max = Math.max(max, inflight);
      await new Promise((resolve) => setTimeout(resolve, 15));
      try {
        return await work();
      } finally {
        inflight -= 1;
      }
    };
    getPackageUidAt.mockImplementation(async (index: number) =>
      track(async () => `0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/pkg-${index}`),
    );
    getPackage.mockImplementation(async (uid: string) =>
      track(async () => {
        const slug = uid.split('/')[1];
        return {
          ...OFFICIAL,
          package_uid: uid,
          package_slug: slug,
        };
      }),
    );
    await loadPackagePage(INITIAL_ENUMERATION_CURSOR);
    expect(max).toBeLessThanOrEqual(4);
  });

  it('deduplicates duplicate IDs across pages', () => {
    const first = {
      kind: 'ok' as const,
      index: 1,
      id: OFFICIAL.package_uid,
      record: OFFICIAL,
    };
    const duplicate = { ...first, index: 0 };
    const merged = mergeIndexedById([first], [duplicate]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.index).toBe(1);
  });

  it('marks a count change instead of duplicating records', async () => {
    getPackageCount.mockResolvedValue(3);
    const page = await loadPackagePage({ knownTotal: 2, endExclusive: 2, page: 1 });
    expect(page.countChanged).toBe(true);
    expect(page.items).toHaveLength(0);
    expect(getPackageUidAt).not.toHaveBeenCalled();
  });

  it('query keys isolate chain, address, mode, and page', () => {
    const base = {
      dataMode: 'live',
      chainId: 61997,
      contractAddress: '0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3',
      recordType: 'packages' as const,
    };
    expect(registryQueryKeys.enumeration(base)).not.toEqual(
      registryQueryKeys.enumeration({ ...base, dataMode: 'demo' }),
    );
    expect(registryQueryKeys.enumeration(base)).not.toEqual(
      registryQueryKeys.enumeration({ ...base, chainId: 1 }),
    );
    expect(registryQueryKeys.enumeration(base)).not.toEqual(
      registryQueryKeys.enumeration({ ...base, contractAddress: '0x0000000000000000000000000000000000000001' }),
    );
    expect(registryQueryKeys.enumerationPage({ ...base, page: 0, cursor: '20' })).not.toEqual(
      registryQueryKeys.enumerationPage({ ...base, page: 1, cursor: '0' }),
    );
  });

  it('retry path uses read methods only', async () => {
    getPackageCount.mockRejectedValueOnce(new Error('temporary')).mockResolvedValue(0);
    await expect(loadPackagePage()).rejects.toThrow('temporary');
    const page = await loadPackagePage();
    expect(page.totalCount).toBe(0);
    expect(getPackageUidAt).not.toHaveBeenCalled();
  });

  it('a malformed single record does not crash the snapshot', async () => {
    getPackageCount.mockResolvedValue(2);
    getPackageUidAt.mockImplementation(async (index: number) => (index === 0 ? LEGACY.package_uid : OFFICIAL.package_uid));
    getPackage.mockImplementation(async (uid: string) => {
      if (uid === LEGACY.package_uid) {
        return { ...LEGACY, charter_hash: 'not-a-hash' };
      }
      return OFFICIAL;
    });
    const page = await loadPackagePage();
    expect(page.items).toHaveLength(2);
    expect(page.items.some((item) => item.kind === 'integrity')).toBe(true);
    expect(page.items.some((item) => item.kind === 'ok' && item.id === OFFICIAL.package_uid)).toBe(true);
  });

  it('rethrows required package record-read failures instead of converting them to integrity items', async () => {
    getPackageCount.mockResolvedValue(2);
    getPackageUidAt.mockImplementation(async (index: number) => (index === 0 ? LEGACY.package_uid : OFFICIAL.package_uid));
    getPackage.mockRejectedValue(new Error('429 Too Many Requests'));
    await expect(loadPackagePage()).rejects.toThrow(/429|Too Many Requests/);
  });

  it('malformed finding codes become an integrity record', () => {
    const result = inspectIndexedCandidate(0, APPROVED.candidate_id, {
      ...APPROVED,
      finding_codes_json: '{not-an-array}',
    });
    expect(result.kind).toBe('integrity');
  });

  it('labels official and legacy packages', () => {
    expect(knownPackageLabelText(OFFICIAL.package_uid)).toBe('Official UpdateSeal package');
    expect(knownPackageLabelText(LEGACY.package_uid)).toBe('Legacy smoke record');
  });
});
