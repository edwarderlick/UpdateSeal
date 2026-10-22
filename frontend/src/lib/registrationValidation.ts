export const PACKAGE_SLUG_MIN = 3;
export const PACKAGE_SLUG_MAX = 80;
export const REPOSITORY_URL_MAX = 300;

const SLUG_BODY = 'abcdefghijklmnopqrstuvwxyz0123456789.-_';
const SLUG_EDGE = 'abcdefghijklmnopqrstuvwxyz0123456789';
const HEX_ALL = '0123456789abcdefABCDEF';
const HOSTNAME_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-';
const GITHUB_NAME_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-_';

export function hasControlChar(text: string): boolean {
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code < 32 || code === 127) {
      return true;
    }
  }
  return false;
}

export function validatePackageSlug(packageSlug: string): string | null {
  if (typeof packageSlug !== 'string') {
    return 'Package slug must be a string';
  }
  if (packageSlug !== packageSlug.trim()) {
    return 'Package slug must equal its trimmed form';
  }
  if (hasControlChar(packageSlug)) {
    return 'Package slug must not contain whitespace or control characters';
  }
  const n = packageSlug.length;
  if (n < PACKAGE_SLUG_MIN || n > PACKAGE_SLUG_MAX) {
    return 'Package slug must be between 3 and 80 characters';
  }
  if (packageSlug !== packageSlug.toLowerCase()) {
    return 'Package slug must be lowercase';
  }
  if (packageSlug.includes('/') || packageSlug.includes('@')) {
    return "Package slug must not contain '/' or '@'";
  }
  for (const ch of packageSlug) {
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
      return 'Package slug must not contain whitespace or control characters';
    }
    if (!SLUG_BODY.includes(ch)) {
      return 'Package slug contains invalid characters';
    }
  }
  if (!SLUG_EDGE.includes(packageSlug[0]) || !SLUG_EDGE.includes(packageSlug[packageSlug.length - 1])) {
    return 'Package slug must begin and end with a lowercase letter or digit';
  }
  return null;
}

function validHostname(hostname: string): boolean {
  if (!hostname) {
    return false;
  }
  if (hostname[0] === '.' || hostname[0] === '-' || hostname[hostname.length - 1] === '.' || hostname[hostname.length - 1] === '-') {
    return false;
  }
  if (hostname.includes('..')) {
    return false;
  }
  for (const ch of hostname) {
    if (!HOSTNAME_CHARS.includes(ch)) {
      return false;
    }
  }
  return true;
}

function githubNameOk(name: string): boolean {
  if (!name || name === '.' || name === '..') {
    return false;
  }
  if (name[0] === '.' || name[name.length - 1] === '.') {
    return false;
  }
  for (const ch of name) {
    if (!GITHUB_NAME_CHARS.includes(ch)) {
      return false;
    }
  }
  return true;
}

function canonicalPathSegments(
  path: string,
  fieldName: string,
  allowSingleTrailingSlash: boolean,
): { ok: true; parts: string[] } | { ok: false; message: string } {
  if (!path || path[0] !== '/') {
    return { ok: false, message: `${fieldName} path is not canonical` };
  }
  const raw = path.split('/');
  let end = raw.length;
  if (allowSingleTrailingSlash && end > 1 && raw[end - 1] === '') {
    end -= 1;
  }
  const parts: string[] = [];
  for (let i = 1; i < end; i += 1) {
    const item = raw[i];
    if (item === '') {
      return { ok: false, message: `${fieldName} path must not contain empty segments` };
    }
    if (item === '.' || item === '..') {
      return { ok: false, message: `${fieldName} path must not contain '.' or '..' segments` };
    }
    parts.push(item);
  }
  return { ok: true, parts };
}

export function validateGithubRepositoryUrl(repositoryUrl: string): string | null {
  const fieldName = 'Repository URL';
  if (typeof repositoryUrl !== 'string') {
    return `${fieldName} must be a string`;
  }
  if (repositoryUrl !== repositoryUrl.trim()) {
    return `${fieldName} must not contain surrounding whitespace`;
  }
  if (hasControlChar(repositoryUrl) || repositoryUrl.includes(' ')) {
    return `${fieldName} must not contain whitespace or control characters`;
  }
  if (repositoryUrl.length < 1 || repositoryUrl.length > REPOSITORY_URL_MAX) {
    return `${fieldName} must be between 1 and ${REPOSITORY_URL_MAX} characters`;
  }
  if (!repositoryUrl.startsWith('https://')) {
    return `${fieldName} must use HTTPS`;
  }
  if (repositoryUrl.includes('#')) {
    return `${fieldName} must not contain a fragment`;
  }
  if (repositoryUrl.includes('%')) {
    return `${fieldName} must not contain percent-encoded content`;
  }
  if (repositoryUrl.includes('\\')) {
    return `${fieldName} must not contain backslashes`;
  }

  let parsed: URL;
  try {
    parsed = new URL(repositoryUrl);
  } catch {
    return `${fieldName} must contain a valid hostname`;
  }

  if (parsed.protocol !== 'https:') {
    return `${fieldName} must use HTTPS`;
  }
  if (parsed.username !== '' || parsed.password !== '') {
    return `${fieldName} must not contain credentials`;
  }
  if (parsed.hash !== '') {
    return `${fieldName} must not contain a fragment`;
  }
  if (parsed.hostname !== 'github.com') {
    return 'Repository URL host must be github.com';
  }
  if (parsed.port !== '') {
    return 'Repository URL must not contain a custom port';
  }
  if (parsed.search !== '') {
    return 'Repository URL must not contain a query string';
  }
  if (!validHostname(parsed.hostname)) {
    return `${fieldName} must contain a valid hostname`;
  }

  const segments = canonicalPathSegments(parsed.pathname, fieldName, true);
  if (!segments.ok) {
    return segments.message;
  }
  if (segments.parts.length !== 2) {
    return 'Repository URL must be https://github.com/{owner}/{repository}';
  }
  const owner = segments.parts[0];
  let repo = segments.parts[1];
  if (repo.length > 4 && repo.endsWith('.git')) {
    repo = repo.slice(0, -4);
  }
  if (!githubNameOk(owner) || !githubNameOk(repo)) {
    return 'Repository URL must contain a valid owner and repository';
  }
  return null;
}

export function validateCommitSha(sha: string, fieldName = 'Baseline commit SHA'): string | null {
  if (typeof sha !== 'string' || (sha.length !== 40 && sha.length !== 64)) {
    return `${fieldName} must be a 40- or 64-character hexadecimal string`;
  }
  for (const c of sha) {
    if (!HEX_ALL.includes(c)) {
      return `${fieldName} must contain only hexadecimal characters`;
    }
  }
  return null;
}

export function derivePackageUid(publisherAddress: string, packageSlug: string): string {
  return `${publisherAddress.trim().toLowerCase()}/${packageSlug}`;
}

export function livePackagePath(publisherAddress: string, packageSlug: string): string {
  return `/packages/${publisherAddress.trim().toLowerCase()}/${packageSlug}`;
}

export function parseGithubOwnerRepo(
  repositoryUrl: string,
): { owner: string; repo: string } | null {
  if (validateGithubRepositoryUrl(repositoryUrl)) {
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(repositoryUrl);
  } catch {
    return null;
  }
  const segments = canonicalPathSegments(parsed.pathname, 'Repository URL', true);
  if (!segments.ok || segments.parts.length !== 2) {
    return null;
  }
  const owner = segments.parts[0];
  let repo = segments.parts[1];
  if (repo.length > 4 && repo.endsWith('.git')) {
    repo = repo.slice(0, -4);
  }
  return { owner, repo };
}

export function liveCandidateWizardPath(
  publisherAddress: string,
  packageSlug: string,
  step: 'identity' | 'evidence' | 'confirm' = 'identity',
): string {
  return `${livePackagePath(publisherAddress, packageSlug)}/releases/new/${step}`;
}

export function liveCandidateRecordPath(
  publisherAddress: string,
  packageSlug: string,
  version: string,
): string {
  return `${livePackagePath(publisherAddress, packageSlug)}/candidates/${encodeURIComponent(version)}`;
}
