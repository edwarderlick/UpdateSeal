import { validateVersion } from './candidateValidation';
import { hasControlChar, validatePackageSlug } from './registrationValidation';

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export type CandidateIdParseResult =
  | {
      ok: true;
      packageUid: string;
      publisher: string;
      packageSlug: string;
      version: string;
      candidateId: string;
      displayPackageUid: string;
      displayCandidateId: string;
    }
  | { ok: false; message: string };

export type PackageUidParseResult =
  | {
      ok: true;
      packageUid: string;
      publisher: string;
      packageSlug: string;
      displayPackageUid: string;
    }
  | { ok: false; message: string };

function hasInternalWhitespace(value: string): boolean {
  return /[\s]/.test(value);
}

export function parsePackageUid(raw: string): PackageUidParseResult {
  if (typeof raw !== 'string') {
    return { ok: false, message: 'Package UID must be a string.' };
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, message: 'Package UID is required.' };
  }
  if (hasControlChar(trimmed) || hasInternalWhitespace(trimmed)) {
    return { ok: false, message: 'Package UID must not contain whitespace or control characters.' };
  }
  const slash = trimmed.indexOf('/');
  if (slash <= 0 || slash !== trimmed.lastIndexOf('/') || slash === trimmed.length - 1) {
    return { ok: false, message: 'Package UID must be publisher/packageSlug.' };
  }
  const publisher = trimmed.slice(0, slash);
  const packageSlug = trimmed.slice(slash + 1);
  if (!ADDRESS_RE.test(publisher)) {
    return { ok: false, message: 'Package UID publisher must be a 20-byte 0x-prefixed address.' };
  }
  const slugError = validatePackageSlug(packageSlug);
  if (slugError) {
    return { ok: false, message: slugError };
  }
  const packageUid = `${publisher.toLowerCase()}/${packageSlug}`;
  return {
    ok: true,
    packageUid,
    publisher: publisher.toLowerCase(),
    packageSlug,
    displayPackageUid: trimmed,
  };
}

export function parseCandidateId(raw: string): CandidateIdParseResult {
  if (typeof raw !== 'string') {
    return { ok: false, message: 'Candidate ID must be a string.' };
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, message: 'Candidate ID is required.' };
  }
  if (hasControlChar(trimmed) || hasInternalWhitespace(trimmed)) {
    return { ok: false, message: 'Candidate ID must not contain whitespace or control characters.' };
  }
  const at = trimmed.lastIndexOf('@');
  const atCount = trimmed.split('@').length - 1;
  if (atCount !== 1 || at <= 0 || at === trimmed.length - 1) {
    return { ok: false, message: 'Candidate ID must contain exactly one @ separator between package UID and version.' };
  }
  const packagePart = trimmed.slice(0, at);
  const version = trimmed.slice(at + 1);
  const packageResult = parsePackageUid(packagePart);
  if (!packageResult.ok) {
    return packageResult;
  }
  const versionError = validateVersion(version);
  if (versionError) {
    return { ok: false, message: versionError };
  }
  const candidateId = `${packageResult.packageUid}@${version}`;
  return {
    ok: true,
    packageUid: packageResult.packageUid,
    publisher: packageResult.publisher,
    packageSlug: packageResult.packageSlug,
    version,
    candidateId,
    displayPackageUid: packageResult.displayPackageUid,
    displayCandidateId: trimmed,
  };
}

export function parsePackageUidAndVersion(packageUidRaw: string, versionRaw: string): CandidateIdParseResult {
  const packageResult = parsePackageUid(packageUidRaw);
  if (!packageResult.ok) {
    return packageResult;
  }
  if (typeof versionRaw !== 'string') {
    return { ok: false, message: 'Version must be a string.' };
  }
  const version = versionRaw.trim();
  if (version.length === 0) {
    return { ok: false, message: 'Version is required.' };
  }
  const versionError = validateVersion(version);
  if (versionError) {
    return { ok: false, message: versionError };
  }
  return {
    ok: true,
    packageUid: packageResult.packageUid,
    publisher: packageResult.publisher,
    packageSlug: packageResult.packageSlug,
    version,
    candidateId: `${packageResult.packageUid}@${version}`,
    displayPackageUid: packageResult.displayPackageUid,
    displayCandidateId: `${packageResult.displayPackageUid}@${version}`,
  };
}
