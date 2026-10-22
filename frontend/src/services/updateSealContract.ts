import { getReadOnlyGenLayerClient } from '../lib/genlayerClient';
import { getUpdateSealConfig } from '../lib/updateSealConfig';
import { toUpdateSealError, UpdateSealError } from '../lib/updateSealErrors';
import {
  MAX_READ_CONCURRENCY,
  MAX_REGISTRY_CANDIDATES,
  MAX_REGISTRY_PACKAGES,
  type OnChainCandidateRecord,
  type OnChainPackageRecord,
  type RegistrySnapshot,
} from '../types/updateSeal';
import { mapCandidateRecord, mapPackageRecord, normalizeBoolean, normalizeString, normalizeUint } from './updateSealMappers';

export const CONTRACT_METHODS = Object.freeze({
  packageCount: 'package_count',
  packageUidAt: 'package_uid_at',
  packageExists: 'package_exists',
  getPackage: 'get_package',
  getPackageUid: 'get_package_uid',
  candidateCount: 'candidate_count',
  candidateIdAt: 'candidate_id_at',
  candidateExists: 'candidate_exists',
  getCandidate: 'get_candidate',
  getCandidateId: 'get_candidate_id',
  registerPackage: 'register_package',
  submitCandidate: 'submit_candidate',
  evaluateCandidate: 'evaluate_candidate',
});

export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }
  const limit = Math.max(1, concurrency);
  const results: R[] = new Array(items.length);
  let cursor = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) {
        return;
      }
      results[index] = await mapper(items[index], index);
    }
  });

  await Promise.all(workers);
  return results;
}

async function readContract(functionName: string, args: unknown[] = []): Promise<unknown> {
  const config = getUpdateSealConfig();
  try {
    return await getReadOnlyGenLayerClient().readContract({
      address: config.contractAddress,
      functionName,
      args,
    });
  } catch (error) {
    throw toUpdateSealError(error);
  }
}

export async function getPackageCount(): Promise<number> {
  const value = await readContract(CONTRACT_METHODS.packageCount);
  return normalizeUint(value, 'package_count');
}

export async function getPackageUidAt(index: number): Promise<string> {
  const value = await readContract(CONTRACT_METHODS.packageUidAt, [index]);
  return normalizeString(value, 'package_uid_at');
}

export async function packageExists(packageUid: string): Promise<boolean> {
  const value = await readContract(CONTRACT_METHODS.packageExists, [packageUid]);
  return normalizeBoolean(value, 'package_exists');
}

export async function getPackage(packageUid: string): Promise<OnChainPackageRecord> {
  try {
    const value = await readContract(CONTRACT_METHODS.getPackage, [packageUid]);
    return mapPackageRecord(value);
  } catch (error) {
    if (error instanceof UpdateSealError && error.code === 'CONTRACT_RESPONSE_INVALID') {
      throw error;
    }
    throw toUpdateSealError(error, 'CONTRACT_NOT_FOUND');
  }
}

export async function getPackageUid(publisherAddress: string, packageSlug: string): Promise<string> {
  const value = await readContract(CONTRACT_METHODS.getPackageUid, [publisherAddress, packageSlug]);
  return normalizeString(value, 'get_package_uid');
}

export async function getCandidateCount(): Promise<number> {
  const value = await readContract(CONTRACT_METHODS.candidateCount);
  return normalizeUint(value, 'candidate_count');
}

export async function getCandidateIdAt(index: number): Promise<string> {
  const value = await readContract(CONTRACT_METHODS.candidateIdAt, [index]);
  return normalizeString(value, 'candidate_id_at');
}

export async function candidateExists(candidateId: string): Promise<boolean> {
  const value = await readContract(CONTRACT_METHODS.candidateExists, [candidateId]);
  return normalizeBoolean(value, 'candidate_exists');
}

export async function getCandidate(candidateId: string): Promise<OnChainCandidateRecord> {
  try {
    const value = await readContract(CONTRACT_METHODS.getCandidate, [candidateId]);
    return mapCandidateRecord(value);
  } catch (error) {
    if (error instanceof UpdateSealError && error.code === 'CONTRACT_RESPONSE_INVALID') {
      throw error;
    }
    throw toUpdateSealError(error, 'CONTRACT_NOT_FOUND');
  }
}

export async function getCandidateId(packageUid: string, version: string): Promise<string> {
  const value = await readContract(CONTRACT_METHODS.getCandidateId, [packageUid, version]);
  return normalizeString(value, 'get_candidate_id');
}

export async function getRegistrySnapshot(): Promise<RegistrySnapshot> {
  let packageCount: number;
  let candidateCount: number;
  try {
    [packageCount, candidateCount] = await Promise.all([getPackageCount(), getCandidateCount()]);
  } catch (error) {
    throw toUpdateSealError(error, 'INDEX_READ_FAILED');
  }

  const packageLimit = Math.min(packageCount, MAX_REGISTRY_PACKAGES);
  const candidateLimit = Math.min(candidateCount, MAX_REGISTRY_CANDIDATES);
  const truncatedPackages = packageCount > MAX_REGISTRY_PACKAGES;
  const truncatedCandidates = candidateCount > MAX_REGISTRY_CANDIDATES;

  const packageIndexes = Array.from({ length: packageLimit }, (_, index) => index);
  const candidateIndexes = Array.from({ length: candidateLimit }, (_, index) => index);

  const packageUids = await mapWithConcurrency(packageIndexes, MAX_READ_CONCURRENCY, (index) =>
    getPackageUidAt(index),
  );
  const packages = await mapWithConcurrency(packageUids, MAX_READ_CONCURRENCY, (uid) => getPackage(uid));

  const candidateIds = await mapWithConcurrency(candidateIndexes, MAX_READ_CONCURRENCY, (index) =>
    getCandidateIdAt(index),
  );
  const candidates = await mapWithConcurrency(candidateIds, MAX_READ_CONCURRENCY, (id) => getCandidate(id));

  const truncationWarning =
    truncatedPackages || truncatedCandidates
      ? `Showing ${packageLimit} of ${packageCount} packages and ${candidateLimit} of ${candidateCount} candidates.`
      : null;

  return Object.freeze({
    packageCount,
    candidateCount,
    packages: Object.freeze(packages),
    candidates: Object.freeze(candidates),
    truncatedPackages,
    truncatedCandidates,
    truncationWarning,
  });
}
