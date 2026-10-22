export const OFFICIAL_UPDATESEAL_PACKAGE_UID =
  '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal';

export const LEGACY_SMOKE_PACKAGE_UID =
  '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal-v2-e2e';

export const LEGACY_SMOKE_EXPLANATION =
  'This immutable Studio-dev smoke record is preserved for testing and is not the official UpdateSeal package.';

export type KnownPackageLabel = 'official' | 'legacy_smoke';

function normalizeUid(packageUid: string): string {
  const slash = packageUid.indexOf('/');
  if (slash <= 0) {
    return packageUid;
  }
  return `${packageUid.slice(0, slash).toLowerCase()}/${packageUid.slice(slash + 1)}`;
}

export function knownPackageLabel(packageUid: string): KnownPackageLabel | null {
  const normalized = normalizeUid(packageUid);
  if (normalized === OFFICIAL_UPDATESEAL_PACKAGE_UID) {
    return 'official';
  }
  if (normalized === LEGACY_SMOKE_PACKAGE_UID) {
    return 'legacy_smoke';
  }
  return null;
}

export function knownPackageLabelText(packageUid: string): string | null {
  const kind = knownPackageLabel(packageUid);
  if (kind === 'official') {
    return 'Official UpdateSeal package';
  }
  if (kind === 'legacy_smoke') {
    return 'Legacy smoke record';
  }
  return null;
}
