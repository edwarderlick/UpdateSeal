import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_READ_CONCURRENCY, MAX_REGISTRY_CANDIDATES, MAX_REGISTRY_PACKAGES } from '../types/updateSeal';
import { SAMPLE_CANDIDATE, SMOKE_PACKAGE } from '../test/updateSealFixtures';
import { UpdateSealError } from '../lib/updateSealErrors';

const readContract = vi.fn();

vi.mock('../lib/genlayerClient', () => ({
  getReadOnlyGenLayerClient: () => ({
    readContract,
  }),
}));

import {
  CONTRACT_METHODS,
  candidateExists,
  getCandidate,
  getCandidateCount,
  getCandidateId,
  getCandidateIdAt,
  getPackage,
  getPackageCount,
  getPackageUid,
  getPackageUidAt,
  getRegistrySnapshot,
  mapWithConcurrency,
  packageExists,
} from './updateSealContract';

const CONTRACT = '0xCdf0410A2883c27983d5C3062E40F88dfc83c5E3';

describe('updateSealContract', () => {
  beforeEach(() => {
    readContract.mockReset();
  });

  it('7. uses deployed method names and contract address for all public reads', async () => {
    readContract.mockImplementation(async ({ functionName }: { functionName: string }) => {
      switch (functionName) {
        case CONTRACT_METHODS.packageCount:
          return 1;
        case CONTRACT_METHODS.packageUidAt:
          return SMOKE_PACKAGE.package_uid;
        case CONTRACT_METHODS.packageExists:
          return true;
        case CONTRACT_METHODS.getPackage:
          return SMOKE_PACKAGE;
        case CONTRACT_METHODS.getPackageUid:
          return SMOKE_PACKAGE.package_uid;
        case CONTRACT_METHODS.candidateCount:
          return 1;
        case CONTRACT_METHODS.candidateIdAt:
          return SAMPLE_CANDIDATE.candidate_id;
        case CONTRACT_METHODS.candidateExists:
          return true;
        case CONTRACT_METHODS.getCandidate:
          return SAMPLE_CANDIDATE;
        case CONTRACT_METHODS.getCandidateId:
          return SAMPLE_CANDIDATE.candidate_id;
        default:
          throw new Error(`unexpected method ${functionName}`);
      }
    });

    await getPackageCount();
    await getPackageUidAt(0);
    await packageExists(SMOKE_PACKAGE.package_uid);
    await getPackage(SMOKE_PACKAGE.package_uid);
    await getPackageUid(SMOKE_PACKAGE.publisher, SMOKE_PACKAGE.package_slug);
    await getCandidateCount();
    await getCandidateIdAt(0);
    await candidateExists(SAMPLE_CANDIDATE.candidate_id);
    await getCandidate(SAMPLE_CANDIDATE.candidate_id);
    await getCandidateId(SMOKE_PACKAGE.package_uid, SAMPLE_CANDIDATE.version);

    const names = readContract.mock.calls.map((call) => call[0].functionName);
    expect(names).toEqual([
      'package_count',
      'package_uid_at',
      'package_exists',
      'get_package',
      'get_package_uid',
      'candidate_count',
      'candidate_id_at',
      'candidate_exists',
      'get_candidate',
      'get_candidate_id',
    ]);
    expect(names.some((name: string) => name.startsWith('get_package_count'))).toBe(false);
    expect(names).not.toContain('get_protocol_info');
    expect(names).not.toContain('evaluate_candidate');
    expect(CONTRACT_METHODS.submitCandidate).toBe('submit_candidate');
    expect(CONTRACT_METHODS.evaluateCandidate).toBe('evaluate_candidate');
    for (const call of readContract.mock.calls) {
      expect(call[0].address).toBe(CONTRACT);
    }
  });

  it('14. never exceeds concurrency 4 while mapping registry records', async () => {
    let inflight = 0;
    let maxInflight = 0;
    const items = Array.from({ length: 12 }, (_, index) => index);
    await mapWithConcurrency(items, MAX_READ_CONCURRENCY, async (item) => {
      inflight += 1;
      maxInflight = Math.max(maxInflight, inflight);
      await new Promise((resolve) => setTimeout(resolve, 20));
      inflight -= 1;
      return item;
    });
    expect(maxInflight).toBe(MAX_READ_CONCURRENCY);
    expect(maxInflight).toBeLessThanOrEqual(4);
  });

  it('15. caps registry package reads at 200', async () => {
    readContract.mockImplementation(async ({ functionName, args }: { functionName: string; args?: unknown[] }) => {
      if (functionName === 'package_count') return 205;
      if (functionName === 'candidate_count') return 0;
      if (functionName === 'package_uid_at') return `uid-${args?.[0]}`;
      if (functionName === 'get_package') {
        return { ...SMOKE_PACKAGE, package_uid: String(args?.[0]), package_slug: `pkg-${args?.[0]}` };
      }
      throw new Error(functionName);
    });

    const snapshot = await getRegistrySnapshot();
    const uidCalls = readContract.mock.calls.filter((call) => call[0].functionName === 'package_uid_at');
    expect(uidCalls).toHaveLength(MAX_REGISTRY_PACKAGES);
    expect(snapshot.packages).toHaveLength(MAX_REGISTRY_PACKAGES);
    expect(snapshot.packageCount).toBe(205);
    expect(snapshot.truncatedPackages).toBe(true);
    expect(snapshot.truncationWarning).toMatch(/200 of 205 packages/);
  });

  it('16. caps registry candidate reads at 500', async () => {
    readContract.mockImplementation(async ({ functionName, args }: { functionName: string; args?: unknown[] }) => {
      if (functionName === 'package_count') return 0;
      if (functionName === 'candidate_count') return 510;
      if (functionName === 'candidate_id_at') return `cand-${args?.[0]}`;
      if (functionName === 'get_candidate') {
        return { ...SAMPLE_CANDIDATE, candidate_id: String(args?.[0]) };
      }
      throw new Error(functionName);
    });

    const snapshot = await getRegistrySnapshot();
    const idCalls = readContract.mock.calls.filter((call) => call[0].functionName === 'candidate_id_at');
    expect(idCalls).toHaveLength(MAX_REGISTRY_CANDIDATES);
    expect(snapshot.candidates).toHaveLength(MAX_REGISTRY_CANDIDATES);
    expect(snapshot.candidateCount).toBe(510);
    expect(snapshot.truncatedCandidates).toBe(true);
  });

  it('rejects a malformed package record from get_package', async () => {
    readContract.mockResolvedValue({ package_uid: 'only-uid' });
    await expect(getPackage('missing')).rejects.toMatchObject({ code: 'CONTRACT_RESPONSE_INVALID' });
  });

  it('rejects a malformed candidate record from get_candidate', async () => {
    readContract.mockResolvedValue({ candidate_id: 'only-id' });
    await expect(getCandidate('missing')).rejects.toMatchObject({ code: 'CONTRACT_RESPONSE_INVALID' });
  });

  it('maps RPC failures to RPC_UNAVAILABLE', async () => {
    readContract.mockRejectedValue(new Error('Failed to fetch'));
    await expect(getPackageCount()).rejects.toBeInstanceOf(UpdateSealError);
    await expect(getPackageCount()).rejects.toMatchObject({ code: 'RPC_UNAVAILABLE' });
  });
});
