import { hasControlChar, parseGithubOwnerRepo, validateCommitSha } from './registrationValidation';

export const VERSION_MIN = 1;
export const VERSION_MAX = 40;
export const EVIDENCE_URI_MAX = 500;
export const EVIDENCE_HASH_LEN = 64;
export const EVIDENCE_BODY_MAX = 100000;
export const DIFF_SUMMARY_MAX = 8000;
export const CHANGED_FILES_MAX = 100;
export const EVIDENCE_STRING_ARRAY_MAX = 50;
export const EVIDENCE_TESTS_MAX = 100;
export const EVIDENCE_STRING_ENTRY_MAX = 300;
export const TEST_NAME_MAX = 200;

const VERSION_BODY = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.+-';
const HEX_ALL = '0123456789abcdefABCDEF';
const HOSTNAME_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-';
const GITHUB_NAME_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-_';

export function unicodeCodePointLength(text: string): number {
  return Array.from(text).length;
}

export function deriveCandidateId(packageUid: string, version: string): string {
  return `${packageUid}@${version}`;
}

export function validateVersion(version: string): string | null {
  if (typeof version !== 'string') {
    return 'Version must be a string';
  }
  if (version !== version.trim()) {
    return 'Version must equal its trimmed form';
  }
  if (hasControlChar(version)) {
    return 'Version must not contain whitespace or control characters';
  }
  const n = unicodeCodePointLength(version);
  if (n < VERSION_MIN || n > VERSION_MAX) {
    return 'Version must be between 1 and 40 characters';
  }
  if (version.includes('@') || version.includes('/')) {
    return "Version must not contain '/' or '@'";
  }
  for (const ch of version) {
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
      return 'Version must not contain whitespace or control characters';
    }
    if (!VERSION_BODY.includes(ch)) {
      return 'Version contains invalid characters';
    }
  }
  return null;
}

export function validateCandidateCommitSha(sha: string): string | null {
  return validateCommitSha(sha, 'Candidate commit SHA');
}

export function normalizeEvidenceHash(evidenceHash: string): { ok: true; hash: string } | { ok: false; message: string } {
  if (typeof evidenceHash !== 'string' || evidenceHash.length !== EVIDENCE_HASH_LEN) {
    return { ok: false, message: 'Evidence hash must be a 64-character SHA-256 hexadecimal digest' };
  }
  for (const c of evidenceHash) {
    if (!HEX_ALL.includes(c)) {
      return { ok: false, message: 'Evidence hash must be a 64-character SHA-256 hexadecimal digest' };
    }
  }
  return { ok: true, hash: evidenceHash.toLowerCase() };
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

export interface ParsedRawGithubEvidence {
  owner: string;
  repo: string;
  commitSha: string;
  filePath: string;
}

export function parseRawGithubEvidence(
  evidenceUri: string,
): { ok: true; parsed: ParsedRawGithubEvidence } | { ok: false; message: string } {
  const fieldName = 'Evidence URI';
  if (typeof evidenceUri !== 'string') {
    return { ok: false, message: `${fieldName} must be a string` };
  }
  if (evidenceUri !== evidenceUri.trim()) {
    return { ok: false, message: `${fieldName} must not contain surrounding whitespace` };
  }
  if (hasControlChar(evidenceUri) || evidenceUri.includes(' ')) {
    return { ok: false, message: `${fieldName} must not contain whitespace or control characters` };
  }
  const n = unicodeCodePointLength(evidenceUri);
  if (n < 1 || n > EVIDENCE_URI_MAX) {
    return { ok: false, message: `${fieldName} must be between 1 and ${EVIDENCE_URI_MAX} characters` };
  }
  if (!evidenceUri.startsWith('https://')) {
    return { ok: false, message: `${fieldName} must use HTTPS` };
  }
  if (evidenceUri.includes('#')) {
    return { ok: false, message: `${fieldName} must not contain a fragment` };
  }
  if (evidenceUri.includes('%')) {
    return { ok: false, message: `${fieldName} must not contain percent-encoded content` };
  }
  if (evidenceUri.includes('\\')) {
    return { ok: false, message: `${fieldName} must not contain backslashes` };
  }

  let parsed: URL;
  try {
    parsed = new URL(evidenceUri);
  } catch {
    return { ok: false, message: `${fieldName} must contain a valid hostname` };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, message: `${fieldName} must use HTTPS` };
  }
  if (parsed.username !== '' || parsed.password !== '') {
    return { ok: false, message: `${fieldName} must not contain credentials` };
  }
  if (parsed.hash !== '') {
    return { ok: false, message: `${fieldName} must not contain a fragment` };
  }
  if (parsed.hostname !== 'raw.githubusercontent.com') {
    return { ok: false, message: 'Evidence URI host must be raw.githubusercontent.com' };
  }
  if (parsed.port !== '') {
    return { ok: false, message: 'Evidence URI must not contain a custom port' };
  }
  if (parsed.search !== '') {
    return { ok: false, message: 'Evidence URI must not contain a query string' };
  }
  if (!validHostname(parsed.hostname)) {
    return { ok: false, message: `${fieldName} must contain a valid hostname` };
  }
  const afterScheme = evidenceUri.slice('https://'.length);
  const pathStart = afterScheme.indexOf('/');
  if (pathStart >= 0) {
    const rawPath = afterScheme.slice(pathStart);
    if (rawPath.includes('//')) {
      return { ok: false, message: `${fieldName} path must not contain empty segments` };
    }
    for (const item of rawPath.split('/')) {
      if (item === '.' || item === '..') {
        return { ok: false, message: `${fieldName} path must not contain '.' or '..' segments` };
      }
    }
  }

  const segments = canonicalPathSegments(parsed.pathname, fieldName, false);
  if (!segments.ok) {
    return { ok: false, message: segments.message };
  }
  if (segments.parts.length < 4) {
    return {
      ok: false,
      message: 'Evidence URI must be https://raw.githubusercontent.com/{owner}/{repository}/{commit}/{path}',
    };
  }
  const owner = segments.parts[0];
  const repo = segments.parts[1];
  const commitSha = segments.parts[2];
  const fileParts = segments.parts.slice(3);
  for (const segment of fileParts) {
    if (segment === '' || segment === '.' || segment === '..') {
      return { ok: false, message: "Evidence URI path must not contain empty, '.' or '..' segments" };
    }
  }
  const filePath = fileParts.join('/');
  if (!githubNameOk(owner) || !githubNameOk(repo)) {
    return { ok: false, message: 'Evidence URI must contain a valid owner and repository' };
  }
  if (filePath === '') {
    return { ok: false, message: 'Evidence URI path must be non-empty' };
  }
  return { ok: true, parsed: { owner, repo, commitSha, filePath } };
}

export function validateEvidenceMatchesPackage(
  evidenceUri: string,
  repositoryUrl: string,
  candidateCommitSha: string,
): string | null {
  const evidence = parseRawGithubEvidence(evidenceUri);
  if (!evidence.ok) {
    return evidence.message;
  }
  const pkg = parseGithubOwnerRepo(repositoryUrl);
  if (!pkg) {
    return 'Registered repository URL is invalid';
  }
  if (evidence.parsed.owner !== pkg.owner) {
    return 'Evidence URI owner must match the registered GitHub repository';
  }
  if (evidence.parsed.repo !== pkg.repo) {
    return 'Evidence URI repository must match the registered GitHub repository';
  }
  if (evidence.parsed.commitSha !== candidateCommitSha) {
    return 'Evidence URI commit must match the candidate commit SHA';
  }
  return null;
}

export function isSemverRecommendation(version: string): boolean {
  return /^v?[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$/.test(version);
}
