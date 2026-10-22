import {
  EVIDENCE_SCHEMA_VERSION,
  parseEvidenceDocument,
  type EvidenceTestEntry,
  type ParsedEvidenceDocument,
} from './evidencePreflight';

export interface EvidenceV2TemplateInput {
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

export type EvidenceV2TemplateResult =
  | { ok: true; json: string; document: ParsedEvidenceDocument }
  | { ok: false; message: string };

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(record).sort()) {
      sorted[key] = sortKeysDeep(record[key]);
    }
    return sorted;
  }
  return value;
}

export function serializeEvidenceV2Json(value: unknown): string {
  return JSON.stringify(sortKeysDeep(value));
}

export function buildEvidenceV2Template(input: EvidenceV2TemplateInput): EvidenceV2TemplateResult {
  const record = {
    schema_version: EVIDENCE_SCHEMA_VERSION,
    package_uid: input.packageUid,
    version: input.version,
    baseline_commit_sha: input.baselineCommitSha,
    diff_summary: input.diffSummary,
    changed_files: input.changedFiles,
    declared_capabilities: input.declaredCapabilities,
    requested_domains: input.requestedDomains,
    evidence_items: input.evidenceItems,
    tests: input.tests.map((test) => ({ name: test.name, status: test.status })),
  };
  const json = serializeEvidenceV2Json(record);
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, message: 'Evidence template JSON could not be parsed.' };
  }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && 'candidate_commit_sha' in parsed) {
    return { ok: false, message: 'Evidence Schema v2 must not contain candidate_commit_sha.' };
  }
  const document = parseEvidenceDocument(parsed, {
    packageUid: input.packageUid,
    version: input.version,
    baselineCommitSha: input.baselineCommitSha,
    candidateCommitSha: '',
  });
  if (!document.ok) {
    return { ok: false, message: document.message };
  }
  return { ok: true, json, document: document.document };
}
