import { useQuery } from '@tanstack/react-query';
import { getUpdateSealConfigResult, isLiveReadsEnabled } from '../../lib/updateSealConfig';
import { UpdateSealError } from '../../lib/updateSealErrors';
import type { VerifyLookupInput } from '../../lib/verifyRelease';
import { verifyLiveRelease } from '../../lib/verifyRelease';
import {
  getCandidate,
  getPackage,
  getPackageUid,
  getRegistrySnapshot,
  packageExists,
} from '../../services/updateSealContract';
import { registryQueryKeys } from './registryQueryKeys';

const LIVE_QUERY_OPTIONS = {
  staleTime: 30_000,
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 5000),
  refetchOnWindowFocus: false as const,
};

export function useRegistrySnapshot() {
  const configResult = getUpdateSealConfigResult();
  const liveEnabled = isLiveReadsEnabled(configResult);
  return useQuery({
    queryKey: registryQueryKeys.snapshot(),
    queryFn: getRegistrySnapshot,
    enabled: liveEnabled,
    ...LIVE_QUERY_OPTIONS,
  });
}

export function useOnChainPackage(packageUid: string | undefined) {
  const configResult = getUpdateSealConfigResult();
  const liveEnabled = isLiveReadsEnabled(configResult);
  return useQuery({
    queryKey: registryQueryKeys.package(packageUid ?? ''),
    queryFn: () => getPackage(packageUid as string),
    enabled: liveEnabled && Boolean(packageUid),
    ...LIVE_QUERY_OPTIONS,
  });
}

export function useOnChainCandidate(candidateId: string | undefined) {
  const configResult = getUpdateSealConfigResult();
  const liveEnabled = isLiveReadsEnabled(configResult);
  return useQuery({
    queryKey: registryQueryKeys.candidate(candidateId ?? ''),
    queryFn: () => getCandidate(candidateId as string),
    enabled: liveEnabled && Boolean(candidateId),
    ...LIVE_QUERY_OPTIONS,
  });
}

export function useOnChainPackageByPublisherSlug(publisher: string | undefined, packageSlug: string | undefined) {
  const configResult = getUpdateSealConfigResult();
  const liveEnabled = isLiveReadsEnabled(configResult);
  return useQuery({
    queryKey: registryQueryKeys.packageByPublisherSlug(publisher ?? '', packageSlug ?? ''),
    queryFn: async () => {
      if (!publisher || !packageSlug) {
        throw new UpdateSealError('CONTRACT_NOT_FOUND', 'Package identity is incomplete.');
      }
      const packageUid = await getPackageUid(publisher, packageSlug);
      const exists = await packageExists(packageUid);
      if (!exists) {
        throw new UpdateSealError('CONTRACT_NOT_FOUND', 'No package is registered for this publisher and slug.');
      }
      const record = await getPackage(packageUid);
      return { packageUid, record };
    },
    enabled: liveEnabled && Boolean(publisher && packageSlug),
    ...LIVE_QUERY_OPTIONS,
  });
}

export function useLiveReleaseVerification(input: VerifyLookupInput | null) {
  const configResult = getUpdateSealConfigResult();
  const liveEnabled = isLiveReadsEnabled(configResult);
  const lookupKey = input ? `${input.packageUid}@${input.version}` : '';
  return useQuery({
    queryKey: registryQueryKeys.verification(input?.mode ?? 'candidate', lookupKey),
    queryFn: () => verifyLiveRelease(input as VerifyLookupInput),
    enabled: liveEnabled && input !== null,
    ...LIVE_QUERY_OPTIONS,
  });
}
