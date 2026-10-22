export const registryQueryKeys = {
  all: ['updateseal', 'registry'] as const,
  snapshot: () => [...registryQueryKeys.all, 'snapshot'] as const,
  package: (packageUid: string) => [...registryQueryKeys.all, 'package', packageUid] as const,
  packageByPublisherSlug: (publisher: string, packageSlug: string) =>
    [...registryQueryKeys.all, 'package-by-publisher-slug', publisher.toLowerCase(), packageSlug] as const,
  candidate: (candidateId: string) => [...registryQueryKeys.all, 'candidate', candidateId] as const,
  verification: (mode: 'candidate' | 'package', lookupKey: string) =>
    [...registryQueryKeys.all, 'verification', mode, lookupKey] as const,
  enumeration: (args: {
    dataMode: string;
    chainId: number;
    contractAddress: string;
    recordType: 'packages' | 'candidates';
  }) =>
    [
      ...registryQueryKeys.all,
      'enumeration',
      args.dataMode,
      args.chainId,
      args.contractAddress,
      args.recordType,
    ] as const,
  enumerationPage: (args: {
    dataMode: string;
    chainId: number;
    contractAddress: string;
    recordType: 'packages' | 'candidates';
    page: number;
    cursor: string;
  }) => [...registryQueryKeys.enumeration(args), args.page, args.cursor] as const,
};
