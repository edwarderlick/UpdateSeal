const ATLAS_IDS = [
  'atlas-research-agent',
  'atlas-protocol/research-agent',
] as const;

export const ATLAS_DEMO_PACKAGE_IDS: ReadonlySet<string> = new Set(ATLAS_IDS);

export function isAtlasDemoPackageUid(value: string): boolean {
  const lower = value.trim().toLowerCase();
  if (ATLAS_DEMO_PACKAGE_IDS.has(lower)) {
    return true;
  }
  return lower.endsWith('/atlas-research-agent');
}
