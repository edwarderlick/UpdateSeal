export const DESIGN_DEMO_BANNER_HEADING = 'DESIGN DEMO — NOT LIVE CONTRACT FUNCTIONALITY';

export const DESIGN_DEMO_BANNER_COPY =
  'This preserved Stitch concept screen contains illustrative governance UI. UpdateSealRegistry v1 does not implement multisig voting, escrow, bonds, appeals, payouts, slashing, or external deployment control.';

const LIVE_PACKAGE_PREFIX = /^\/packages\/0x[a-fA-F0-9]{40}(?:\/|$)/i;

/** Stitch concept screens that must never be mistaken for live contract UI. */
export function isDesignDemoPath(pathname: string): boolean {
  const path = pathname.split('?')[0].replace(/\/+$/, '') || '/';
  if (path === '/reviews' || path.startsWith('/reviews/')) return true;
  if (path === '/decisions' || path.startsWith('/decisions/')) return true;
  if (path === '/packages' || path.startsWith('/packages/')) {
    return !LIVE_PACKAGE_PREFIX.test(path);
  }
  return false;
}
