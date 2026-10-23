import { parseCandidateId, parsePackageUid } from './candidateId';
import { isValidDecisionHash, parseFindingCodesJson } from './decisionReport';
import { statusMatchesDecisionCode } from './decisionHash';
import {
  getCandidate,
  getCandidateCount,
  getCandidateIdAt,
  getPackage,
  getPackageCount,
  getPackageUidAt,
  mapWithConcurrency,
} from '../services/updateSealContract';
import { MAX_READ_CONCURRENCY } from '../types/updateSeal';
import type { OnChainCandidateRecord, OnChainPackageRecord } from '../types/updateSeal';

export const REGISTRY_PAGE_SIZE = 20;

export type EnumerationCursor = {
  knownTotal: number | null;
  endExclusive: number | null;
  page: number;
};

export const INITIAL_ENUMERATION_CURSOR: EnumerationCursor = {
  knownTotal: null,
  endExclusive: null,
  page: 0,
};

export type IndexedPackage =
  | {
      kind: 'ok';
      index: number;
      id: string;
      record: OnChainPackageRecord;
    }
  | {
      kind: 'integrity';
      index: number;
      id: string | null;
      message: string;
      rawMalformedValue?: string;
    };

export type IndexedCandidate =
  | {
      kind: 'ok';
      index: number;
      id: string;
      record: OnChainCandidateRecord;
      findingCodes: readonly string[];
      associatedPackageUid: string;
    }
  | {
      kind: 'integrity';
      index: number;
      id: string | null;
      message: string;
      rawMalformedValue?: string;
      packageUid?: string;
    };

export interface RegistryRecordPage<T> {
  recordType: 'packages' | 'candidates';
  totalCount: number;
  items: readonly T[];
  nextCursor: EnumerationCursor | null;
  scannedStart: number;
  scannedEndExclusive: number;
  countChanged: boolean;
  page: number;
}

export function publishersMatch(left: string, right: string): boolean {
  return left.trim().toLowerCase() === right.trim().toLowerCase();
}

export function normalizePackageUid(packageUid: string): string {
  const parsed = parsePackageUid(packageUid);
  return parsed.ok ? parsed.packageUid : packageUid;
}

export function inspectIndexedPackage(
  index: number,
  uidFromIndex: string,
  record: OnChainPackageRecord,
): IndexedPackage {
  const parsed = parsePackageUid(record.package_uid);
  if (!parsed.ok) {
    return { kind: 'integrity', index, id: uidFromIndex, message: parsed.message };
  }
  const indexed = parsePackageUid(uidFromIndex);
  if (!indexed.ok) {
    return { kind: 'integrity', index, id: uidFromIndex, message: indexed.message };
  }
  if (indexed.packageUid !== parsed.packageUid) {
    return {
      kind: 'integrity',
      index,
      id: uidFromIndex,
      message: 'package_uid_at identifier does not match get_package.',
    };
  }
  if (!publishersMatch(record.publisher, parsed.publisher)) {
    return {
      kind: 'integrity',
      index,
      id: parsed.packageUid,
      message: 'Package publisher does not match package UID.',
    };
  }
  if (record.package_slug !== parsed.packageSlug) {
    return {
      kind: 'integrity',
      index,
      id: parsed.packageUid,
      message: 'Package slug does not match package UID.',
    };
  }
  if (!isValidDecisionHash(record.charter_hash)) {
    return {
      kind: 'integrity',
      index,
      id: parsed.packageUid,
      message: 'charter_hash must be exactly 64 lowercase hexadecimal characters.',
      rawMalformedValue: record.charter_hash,
    };
  }
  return { kind: 'ok', index, id: parsed.packageUid, record };
}

export function inspectIndexedCandidate(index: number, idFromIndex: string, record: OnChainCandidateRecord): IndexedCandidate {
  const parsed = parseCandidateId(record.candidate_id);
  if (!parsed.ok) {
    return { kind: 'integrity', index, id: idFromIndex, message: parsed.message, packageUid: record.package_uid };
  }
  const indexed = parseCandidateId(idFromIndex);
  if (!indexed.ok) {
    return { kind: 'integrity', index, id: idFromIndex, message: indexed.message, packageUid: record.package_uid };
  }
  if (indexed.candidateId !== parsed.candidateId) {
    return {
      kind: 'integrity',
      index,
      id: idFromIndex,
      message: 'candidate_id_at identifier does not match get_candidate.',
      packageUid: record.package_uid,
    };
  }
  if (record.package_uid !== parsed.packageUid) {
    return {
      kind: 'integrity',
      index,
      id: parsed.candidateId,
      message: 'Candidate package UID does not match candidate ID.',
      packageUid: record.package_uid,
    };
  }
  if (record.version !== parsed.version) {
    return {
      kind: 'integrity',
      index,
      id: parsed.candidateId,
      message: 'Candidate version does not match candidate ID.',
      packageUid: record.package_uid,
    };
  }
  if (!isValidDecisionHash(record.evidence_hash)) {
    return {
      kind: 'integrity',
      index,
      id: parsed.candidateId,
      message: 'evidence_hash must be exactly 64 lowercase hexadecimal characters.',
      rawMalformedValue: record.evidence_hash,
      packageUid: record.package_uid,
    };
  }
  if (!statusMatchesDecisionCode(record.status, record.decision_code)) {
    return {
      kind: 'integrity',
      index,
      id: parsed.candidateId,
      message: 'On-chain status does not match decision_code.',
      packageUid: record.package_uid,
    };
  }
  if (record.status === 'PENDING') {
    const findings =
      record.finding_codes_json.trim().length === 0
        ? { ok: true as const, codes: [] as readonly string[] }
        : parseFindingCodesJson(record.finding_codes_json);
    if (!findings.ok) {
      return {
        kind: 'integrity',
        index,
        id: parsed.candidateId,
        message: findings.reason,
        rawMalformedValue: findings.raw,
        packageUid: record.package_uid,
      };
    }
    return {
      kind: 'ok',
      index,
      id: parsed.candidateId,
      record,
      findingCodes: findings.codes,
      associatedPackageUid: parsed.packageUid,
    };
  }
  const findings = parseFindingCodesJson(record.finding_codes_json);
  if (!findings.ok) {
    return {
      kind: 'integrity',
      index,
      id: parsed.candidateId,
      message: findings.reason,
      rawMalformedValue: findings.raw,
      packageUid: record.package_uid,
    };
  }
  if (!isValidDecisionHash(record.decision_hash)) {
    return {
      kind: 'integrity',
      index,
      id: parsed.candidateId,
      message: 'decision_hash must be exactly 64 lowercase hexadecimal characters for an evaluated candidate.',
      rawMalformedValue: record.decision_hash,
      packageUid: record.package_uid,
    };
  }
  return {
    kind: 'ok',
    index,
    id: parsed.candidateId,
    record,
    findingCodes: findings.codes,
    associatedPackageUid: parsed.packageUid,
  };
}

async function loadSlice<T extends { id: string | null }>(args: {
  recordType: 'packages' | 'candidates';
  cursor: EnumerationCursor;
  readCount: () => Promise<number>;
  readAt: (index: number) => Promise<string>;
  loadRecord: (id: string) => Promise<unknown>;
  inspect: (index: number, id: string, record: never) => T;
}): Promise<RegistryRecordPage<T>> {
  const totalCount = await args.readCount();
  const requestedEnd = args.cursor.endExclusive ?? totalCount;
  if (args.cursor.knownTotal !== null && args.cursor.knownTotal !== totalCount) {
    return {
      recordType: args.recordType,
      totalCount,
      items: [],
      nextCursor: null,
      scannedStart: 0,
      scannedEndExclusive: 0,
      countChanged: true,
      page: args.cursor.page,
    };
  }
  if (requestedEnd > totalCount) {
    return {
      recordType: args.recordType,
      totalCount,
      items: [],
      nextCursor: null,
      scannedStart: 0,
      scannedEndExclusive: 0,
      countChanged: true,
      page: args.cursor.page,
    };
  }
  const endExclusive = requestedEnd;
  const start = Math.max(0, endExclusive - REGISTRY_PAGE_SIZE);
  const indexes = Array.from({ length: endExclusive - start }, (_, offset) => start + offset);
  const inspected = await mapWithConcurrency(indexes, MAX_READ_CONCURRENCY, async (index) => {
    const id = await args.readAt(index);
    const record = await args.loadRecord(id);
    return args.inspect(index, id, record as never);
  });

  const seen = new Set<string>();
  const newestFirst: T[] = [];
  for (let i = inspected.length - 1; i >= 0; i -= 1) {
    const item = inspected[i];
    const id = item.id;
    if (id) {
      if (seen.has(id)) {
        continue;
      }
      seen.add(id);
    }
    newestFirst.push(item);
  }

  const nextCursor: EnumerationCursor | null =
    start > 0
      ? { knownTotal: totalCount, endExclusive: start, page: args.cursor.page + 1 }
      : null;

  return {
    recordType: args.recordType,
    totalCount,
    items: newestFirst,
    nextCursor,
    scannedStart: start,
    scannedEndExclusive: endExclusive,
    countChanged: false,
    page: args.cursor.page,
  };
}

export async function loadPackagePage(
  cursor: EnumerationCursor = INITIAL_ENUMERATION_CURSOR,
): Promise<RegistryRecordPage<IndexedPackage>> {
  return loadSlice({
    recordType: 'packages',
    cursor,
    readCount: getPackageCount,
    readAt: getPackageUidAt,
    loadRecord: getPackage,
    inspect: inspectIndexedPackage,
  });
}

export async function loadCandidatePage(
  cursor: EnumerationCursor = INITIAL_ENUMERATION_CURSOR,
): Promise<RegistryRecordPage<IndexedCandidate>> {
  return loadSlice({
    recordType: 'candidates',
    cursor,
    readCount: getCandidateCount,
    readAt: getCandidateIdAt,
    loadRecord: getCandidate,
    inspect: inspectIndexedCandidate,
  });
}

export function mergeIndexedById<T extends { id: string | null; index: number }>(
  existing: readonly T[],
  incoming: readonly T[],
): T[] {
  const seen = new Set<string>();
  const merged: T[] = [];
  for (const item of [...existing, ...incoming]) {
    if (item.id) {
      if (seen.has(item.id)) {
        continue;
      }
      seen.add(item.id);
    }
    merged.push(item);
  }
  return merged.sort((a, b) => b.index - a.index);
}

export function scannedRange(pages: readonly { scannedStart: number; scannedEndExclusive: number }[]): {
  scanned: number;
  start: number;
  endExclusive: number;
} {
  if (pages.length === 0) {
    return { scanned: 0, start: 0, endExclusive: 0 };
  }
  const start = Math.min(...pages.map((page) => page.scannedStart));
  const endExclusive = Math.max(...pages.map((page) => page.scannedEndExclusive));
  return { scanned: Math.max(0, endExclusive - start), start, endExclusive };
}

export function candidatesForPackageUid(
  packageUid: string,
  candidates: readonly IndexedCandidate[],
): Extract<IndexedCandidate, { kind: 'ok' }>[] {
  const expected = normalizePackageUid(packageUid);
  return candidates.filter(
    (item): item is Extract<IndexedCandidate, { kind: 'ok' }> =>
      item.kind === 'ok' && item.associatedPackageUid === expected,
  );
}

export function highestIndexCandidate(
  candidates: readonly Extract<IndexedCandidate, { kind: 'ok' }>[],
): Extract<IndexedCandidate, { kind: 'ok' }> | null {
  if (candidates.length === 0) {
    return null;
  }
  return candidates.reduce((best, item) => (item.index > best.index ? item : best));
}

export function candidateCountLabel(found: number, scanned: number, total: number, complete: boolean): string {
  if (complete) {
    return found === 1 ? '1 candidate' : `${found} candidates`;
  }
  const recordWord = scanned === 1 ? 'record' : 'records';
  const foundWord = found === 1 ? 'candidate' : 'candidates';
  return `${found} ${foundWord} found in ${scanned} scanned candidate ${recordWord} (${total} on-chain)`;
}

export type ActivityFilter =
  | 'all'
  | 'packages'
  | 'candidates'
  | 'PENDING'
  | 'APPROVED'
  | 'REVIEW_REQUIRED'
  | 'VIOLATION'
  | 'EVIDENCE_UNAVAILABLE';

export function activitySearchHaystack(record: IndexedPackage | IndexedCandidate): string {
  if (record.kind === 'integrity') {
    return `${record.id ?? ''} ${record.message}`.toLowerCase();
  }
  if ('associatedPackageUid' in record) {
    const candidate = record.record;
    return [
      candidate.candidate_id,
      candidate.package_uid,
      candidate.version,
      candidate.submitter,
      candidate.status,
      candidate.candidate_commit_sha,
    ]
      .join(' ')
      .toLowerCase();
  }
  const pkg = record.record;
  return [pkg.package_uid, pkg.package_slug, pkg.publisher, pkg.repository_url].join(' ').toLowerCase();
}

export function matchesLoadedSearch(record: IndexedPackage | IndexedCandidate, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) {
    return true;
  }
  return activitySearchHaystack(record).includes(q);
}
