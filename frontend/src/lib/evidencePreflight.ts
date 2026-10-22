import {
  CHANGED_FILES_MAX,
  DIFF_SUMMARY_MAX,
  EVIDENCE_BODY_MAX,
  EVIDENCE_STRING_ARRAY_MAX,
  EVIDENCE_STRING_ENTRY_MAX,
  EVIDENCE_TESTS_MAX,
  TEST_NAME_MAX,
  unicodeCodePointLength,
} from './candidateValidation';
import { hasControlChar } from './registrationValidation';

export const EVIDENCE_SCHEMA_VERSION = 2;

export const EVIDENCE_REQUIRED_FIELDS = [
  'schema_version',
  'package_uid',
  'version',
  'baseline_commit_sha',
  'diff_summary',
  'changed_files',
  'declared_capabilities',
  'requested_domains',
  'evidence_items',
  'tests',
] as const;

export type EvidencePreflightCode =
  | 'HTTP_ERROR'
  | 'BODY_TOO_LARGE'
  | 'HASH_MISMATCH'
  | 'UTF8_INVALID'
  | 'JSON_INVALID'
  | 'EVIDENCE_SCHEMA_INVALID'
  | 'EVIDENCE_IDENTITY_MISMATCH';

export interface EvidenceIdentity {
  packageUid: string;
  version: string;
  baselineCommitSha: string;
  candidateCommitSha: string;
}

export interface EvidencePreflightInputs {
  evidenceUri: string;
  normalizedEvidenceHash: string;
  packageUid: string;
  version: string;
  baselineCommitSha: string;
  candidateCommitSha: string;
}

export interface EvidenceTestEntry {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
}

export interface ParsedEvidenceDocument {
  schemaVersion: 2;
  packageUid: string;
  version: string;
  baselineCommitSha: string;
  diffSummary: string;
  changedFiles: string[];
  declaredCapabilities: string[];
  requestedDomains: string[];
  evidenceItems: string[];
  tests: EvidenceTestEntry[];
}

export interface EvidencePreflightSuccess {
  ok: true;
  httpStatus: number;
  bodySize: number;
  computedSha256: string;
  expectedSha256: string;
  document: ParsedEvidenceDocument;
  inputs: EvidencePreflightInputs;
}

export interface EvidencePreflightFailure {
  ok: false;
  code: EvidencePreflightCode;
  message: string;
  httpStatus: number | null;
  bodySize: number | null;
  computedSha256: string | null;
  expectedSha256: string;
  document: ParsedEvidenceDocument | null;
  schemaOk: boolean;
  identityOk: boolean;
  inputs: EvidencePreflightInputs;
}

export type EvidencePreflightResult = EvidencePreflightSuccess | EvidencePreflightFailure;

export interface EvidencePreflightDeps {
  fetchFn?: typeof fetch;
  sha256HexFn?: (bytes: Uint8Array) => Promise<string>;
  signal?: AbortSignal;
}

export function buildEvidencePreflightInputs(args: {
  evidenceUri: string;
  evidenceHash: string;
  packageUid: string;
  version: string;
  baselineCommitSha: string;
  candidateCommitSha: string;
}): EvidencePreflightInputs {
  return {
    evidenceUri: args.evidenceUri.trim(),
    normalizedEvidenceHash: args.evidenceHash.trim().toLowerCase(),
    packageUid: args.packageUid,
    version: args.version.trim(),
    baselineCommitSha: args.baselineCommitSha,
    candidateCommitSha: args.candidateCommitSha.trim(),
  };
}

export function evidencePreflightInputsEqual(
  left: EvidencePreflightInputs,
  right: EvidencePreflightInputs,
): boolean {
  return (
    left.evidenceUri === right.evidenceUri &&
    left.normalizedEvidenceHash === right.normalizedEvidenceHash &&
    left.packageUid === right.packageUid &&
    left.version === right.version &&
    left.baselineCommitSha === right.baselineCommitSha &&
    left.candidateCommitSha === right.candidateCommitSha
  );
}

export function isEvidencePreflightCurrent(
  preflight: EvidencePreflightResult | EvidencePreflightSuccess | null | undefined,
  expectedInputs: EvidencePreflightInputs,
): boolean {
  if (!preflight || !preflight.ok) {
    return false;
  }
  if (!evidencePreflightInputsEqual(preflight.inputs, expectedInputs)) {
    return false;
  }
  if (preflight.computedSha256 !== expectedInputs.normalizedEvidenceHash) {
    return false;
  }
  if (preflight.expectedSha256 !== expectedInputs.normalizedEvidenceHash) {
    return false;
  }
  const document = preflight.document;
  return (
    document.packageUid === expectedInputs.packageUid &&
    document.version === expectedInputs.version &&
    document.baselineCommitSha === expectedInputs.baselineCommitSha
  );
}

export function isAbortError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const name = (error as { name?: string }).name;
  return name === 'AbortError';
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const digest = await crypto.subtle.digest('SHA-256', copy);
  return bytesToHex(new Uint8Array(digest));
}

function fail(
  code: EvidencePreflightCode,
  message: string,
  inputs: EvidencePreflightInputs,
  extras: Partial<EvidencePreflightFailure> = {},
  expectedSha256 = extras.expectedSha256 ?? inputs.normalizedEvidenceHash,
): EvidencePreflightFailure {
  return {
    ok: false,
    code,
    message,
    httpStatus: extras.httpStatus ?? null,
    bodySize: extras.bodySize ?? null,
    computedSha256: extras.computedSha256 ?? null,
    expectedSha256,
    document: extras.document ?? null,
    schemaOk: extras.schemaOk ?? false,
    identityOk: extras.identityOk ?? false,
    inputs,
  };
}

function parseStringArray(value: unknown, maxEntries: number): string[] | null {
  if (!Array.isArray(value) || value.length > maxEntries) {
    return null;
  }
  const seen: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') {
      return null;
    }
    if (item !== item.trim() || item === '' || unicodeCodePointLength(item) > EVIDENCE_STRING_ENTRY_MAX) {
      return null;
    }
    if (hasControlChar(item)) {
      return null;
    }
    if (seen.includes(item)) {
      return null;
    }
    seen.push(item);
  }
  return seen;
}

function parseTests(value: unknown): EvidenceTestEntry[] | null {
  if (!Array.isArray(value) || value.length > EVIDENCE_TESTS_MAX) {
    return null;
  }
  const tests: EvidenceTestEntry[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return null;
    }
    const record = item as Record<string, unknown>;
    const keys = Object.keys(record);
    if (keys.length !== 2 || !('name' in record) || !('status' in record)) {
      return null;
    }
    for (const key of keys) {
      if (key !== 'name' && key !== 'status') {
        return null;
      }
    }
    const name = record.name;
    const status = record.status;
    if (typeof name !== 'string' || name !== name.trim() || name === '' || unicodeCodePointLength(name) > TEST_NAME_MAX) {
      return null;
    }
    if (hasControlChar(name)) {
      return null;
    }
    if (status !== 'passed' && status !== 'failed' && status !== 'skipped') {
      return null;
    }
    tests.push({ name, status });
  }
  return tests;
}

export function parseEvidenceDocument(
  parsed: unknown,
  identity: EvidenceIdentity,
): { ok: true; document: ParsedEvidenceDocument } | { ok: false; code: 'EVIDENCE_SCHEMA_INVALID' | 'EVIDENCE_IDENTITY_MISMATCH'; message: string } {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, code: 'EVIDENCE_SCHEMA_INVALID', message: 'Evidence JSON must be an object with the required fields.' };
  }
  const record = parsed as Record<string, unknown>;
  if (record.schema_version === 1) {
    return {
      ok: false,
      code: 'EVIDENCE_SCHEMA_INVALID',
      message: 'Evidence schema version 1 is obsolete. Generate an Evidence Schema v2 document.',
    };
  }
  for (const key of Object.keys(record)) {
    if (!(EVIDENCE_REQUIRED_FIELDS as readonly string[]).includes(key)) {
      return { ok: false, code: 'EVIDENCE_SCHEMA_INVALID', message: `Evidence JSON contains unknown field '${key}'.` };
    }
  }
  for (const required of EVIDENCE_REQUIRED_FIELDS) {
    if (!(required in record)) {
      return { ok: false, code: 'EVIDENCE_SCHEMA_INVALID', message: `Evidence JSON is missing field '${required}'.` };
    }
  }
  if (!Number.isInteger(record.schema_version) || record.schema_version !== EVIDENCE_SCHEMA_VERSION) {
    return { ok: false, code: 'EVIDENCE_SCHEMA_INVALID', message: 'schema_version must be integer 2.' };
  }
  for (const fieldName of ['package_uid', 'version', 'baseline_commit_sha', 'diff_summary'] as const) {
    const value = record[fieldName];
    if (typeof value !== 'string') {
      return { ok: false, code: 'EVIDENCE_SCHEMA_INVALID', message: `Evidence field '${fieldName}' must be a string.` };
    }
    if (value !== value.trim() || hasControlChar(value)) {
      return { ok: false, code: 'EVIDENCE_SCHEMA_INVALID', message: `Evidence field '${fieldName}' must be trimmed and contain no control characters.` };
    }
  }
  if (record.package_uid !== identity.packageUid || record.version !== identity.version) {
    return { ok: false, code: 'EVIDENCE_IDENTITY_MISMATCH', message: 'Evidence package UID or version does not match this candidate.' };
  }
  if (record.baseline_commit_sha !== identity.baselineCommitSha) {
    return { ok: false, code: 'EVIDENCE_IDENTITY_MISMATCH', message: 'Evidence baseline commit SHA does not match the registered package.' };
  }
  const diffSummary = record.diff_summary as string;
  const diffLen = unicodeCodePointLength(diffSummary);
  if (diffLen < 1 || diffLen > DIFF_SUMMARY_MAX) {
    return { ok: false, code: 'EVIDENCE_SCHEMA_INVALID', message: 'diff_summary must be between 1 and 8000 Unicode code points.' };
  }
  const changedFiles = parseStringArray(record.changed_files, CHANGED_FILES_MAX);
  const declared = parseStringArray(record.declared_capabilities, EVIDENCE_STRING_ARRAY_MAX);
  const domains = parseStringArray(record.requested_domains, EVIDENCE_STRING_ARRAY_MAX);
  const items = parseStringArray(record.evidence_items, EVIDENCE_STRING_ARRAY_MAX);
  const tests = parseTests(record.tests);
  if (changedFiles === null || declared === null || domains === null || items === null || tests === null) {
    return { ok: false, code: 'EVIDENCE_SCHEMA_INVALID', message: 'Evidence arrays or tests failed contract schema checks.' };
  }
  return {
    ok: true,
    document: {
      schemaVersion: 2,
      packageUid: record.package_uid as string,
      version: record.version as string,
      baselineCommitSha: record.baseline_commit_sha as string,
      diffSummary,
      changedFiles,
      declaredCapabilities: declared,
      requestedDomains: domains,
      evidenceItems: items,
      tests,
    },
  };
}

async function readCappedBytes(response: Response): Promise<{ ok: true; bytes: Uint8Array } | { ok: false; size: number }> {
  const contentLength = response.headers.get('content-length');
  if (contentLength) {
    const declared = Number(contentLength);
    if (Number.isFinite(declared) && declared > EVIDENCE_BODY_MAX) {
      return { ok: false, size: declared };
    }
  }

  if (!response.body) {
    const buffer = new Uint8Array(await response.arrayBuffer());
    if (buffer.byteLength > EVIDENCE_BODY_MAX) {
      return { ok: false, size: buffer.byteLength };
    }
    return { ok: true, bytes: buffer };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    if (!value) {
      continue;
    }
    total += value.byteLength;
    if (total > EVIDENCE_BODY_MAX) {
      await reader.cancel();
      return { ok: false, size: total };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return { ok: true, bytes };
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (!signal?.aborted) {
    return;
  }
  const reason = signal.reason;
  if (reason instanceof Error) {
    throw reason;
  }
  throw new DOMException('Aborted', 'AbortError');
}

export async function runEvidencePreflight(
  evidenceUri: string,
  expectedHash: string,
  identity: EvidenceIdentity,
  deps: EvidencePreflightDeps = {},
  signal?: AbortSignal,
): Promise<EvidencePreflightResult> {
  const abortSignal = signal ?? deps.signal;
  const inputs = buildEvidencePreflightInputs({
    evidenceUri,
    evidenceHash: expectedHash,
    packageUid: identity.packageUid,
    version: identity.version,
    baselineCommitSha: identity.baselineCommitSha,
    candidateCommitSha: identity.candidateCommitSha,
  });
  const expectedSha256 = inputs.normalizedEvidenceHash;
  const fetchFn = deps.fetchFn ?? fetch;
  const hashFn = deps.sha256HexFn ?? sha256Hex;

  throwIfAborted(abortSignal);

  let response: Response;
  try {
    response = await fetchFn(inputs.evidenceUri, {
      method: 'GET',
      credentials: 'omit',
      redirect: 'follow',
      signal: abortSignal,
    });
  } catch (error) {
    if (isAbortError(error) || abortSignal?.aborted) {
      throw error instanceof Error ? error : new DOMException('Aborted', 'AbortError');
    }
    return fail('HTTP_ERROR', 'Evidence URI could not be fetched.', inputs, { expectedSha256 });
  }

  throwIfAborted(abortSignal);

  if (response.status !== 200) {
    return fail('HTTP_ERROR', `Evidence URI returned HTTP ${response.status}. HTTP 200 is required.`, inputs, {
      httpStatus: response.status,
      expectedSha256,
    });
  }

  const body = await readCappedBytes(response);
  throwIfAborted(abortSignal);
  if (!body.ok) {
    return fail('BODY_TOO_LARGE', 'Evidence body exceeds the 100,000-byte cap.', inputs, {
      httpStatus: 200,
      bodySize: body.size,
      expectedSha256,
    });
  }

  const computedSha256 = await hashFn(body.bytes);
  throwIfAborted(abortSignal);
  if (computedSha256 !== expectedSha256) {
    return fail('HASH_MISMATCH', 'Computed SHA-256 of the fetched bytes does not match the entered evidence hash.', inputs, {
      httpStatus: 200,
      bodySize: body.bytes.byteLength,
      computedSha256,
      expectedSha256,
    });
  }

  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(body.bytes);
  } catch {
    return fail('UTF8_INVALID', 'Evidence body is not valid UTF-8.', inputs, {
      httpStatus: 200,
      bodySize: body.bytes.byteLength,
      computedSha256,
      expectedSha256,
    });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return fail('JSON_INVALID', 'Evidence body is not valid JSON.', inputs, {
      httpStatus: 200,
      bodySize: body.bytes.byteLength,
      computedSha256,
      expectedSha256,
    });
  }

  const document = parseEvidenceDocument(parsed, identity);
  if (!document.ok) {
    return fail(document.code, document.message, inputs, {
      httpStatus: 200,
      bodySize: body.bytes.byteLength,
      computedSha256,
      expectedSha256,
      schemaOk: document.code !== 'EVIDENCE_SCHEMA_INVALID',
      identityOk: document.code !== 'EVIDENCE_IDENTITY_MISMATCH',
    });
  }

  return {
    ok: true,
    httpStatus: 200,
    bodySize: body.bytes.byteLength,
    computedSha256,
    expectedSha256,
    document: document.document,
    inputs,
  };
}
