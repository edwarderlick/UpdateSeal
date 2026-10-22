export const registryQueryKeys = {
  all: ['updateseal', 'registry'] as const,
  snapshot: () => [...registryQueryKeys.all, 'snapshot'] as const,
  package: (packageUid: string) => [...registryQueryKeys.all, 'package', packageUid] as const,
  packageByPublisherSlug: (publisher: string, packageSlug: string) =>
    [...registryQueryKeys.all, 'package-by-publisher-slug', publisher.toLowerCase(), packageSlug] as const,
  candidate: (candidateId: string) => [...registryQueryKeys.all, 'candidate', candidateId] as const,
  verification: (mode: 'candidate' | 'package', lookupKey: string) =>
    [...registryQueryKeys.all, 'verification', mode, lookupKey] as const,
};
