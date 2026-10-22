import { describe, expect, it } from 'vitest';
import { parseEvidenceDocument } from './evidencePreflight';
import { buildEvidenceV2Template, serializeEvidenceV2Json } from './evidenceTemplate';
import { SMOKE_PACKAGE } from '../test/updateSealFixtures';

const input = {
  packageUid: SMOKE_PACKAGE.package_uid,
  version: '1.0.1',
  baselineCommitSha: SMOKE_PACKAGE.baseline_commit_sha,
  diffSummary: 'Adds logging.',
  changedFiles: ['src/index.ts', 'README.md'],
  declaredCapabilities: ['network_egress'],
  requestedDomains: ['github.com'],
  evidenceItems: ['git_diff'],
  tests: [{ name: 'unit', status: 'passed' as const }],
};

describe('Evidence Schema v2 template', () => {
  it('produces deterministic compact JSON with sorted object keys and preserved array order', () => {
    const first = buildEvidenceV2Template(input);
    const second = buildEvidenceV2Template(input);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }
    expect(first.json).toBe(second.json);
    expect(first.json).toBe(serializeEvidenceV2Json(JSON.parse(first.json)));
    expect(first.json).toBe(JSON.stringify(JSON.parse(first.json)));
    expect(first.json.includes('\n')).toBe(false);
    expect(first.json.includes('\t')).toBe(false);
    expect(first.json).not.toContain(': ');
    expect(first.json).not.toContain(', ');
    expect(first.json.indexOf('"changed_files"')).toBeLessThan(first.json.indexOf('"declared_capabilities"'));
    expect(first.json.indexOf('"src/index.ts"')).toBeLessThan(first.json.indexOf('"README.md"'));
    expect(first.json).not.toContain('candidate_commit_sha');
    expect(first.json).not.toContain(input.tests[0].name + ' candidate');
  });

  it('contains no candidate SHA and passes the v2 parser', () => {
    const result = buildEvidenceV2Template(input);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const parsed = JSON.parse(result.json) as Record<string, unknown>;
    expect(parsed.schema_version).toBe(2);
    expect(parsed).not.toHaveProperty('candidate_commit_sha');
    expect(Object.keys(parsed).sort()).toEqual([
      'baseline_commit_sha',
      'changed_files',
      'declared_capabilities',
      'diff_summary',
      'evidence_items',
      'package_uid',
      'requested_domains',
      'schema_version',
      'tests',
      'version',
    ]);
    const document = parseEvidenceDocument(parsed, {
      packageUid: input.packageUid,
      version: input.version,
      baselineCommitSha: input.baselineCommitSha,
      candidateCommitSha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
    });
    expect(document.ok).toBe(true);
  });
});
