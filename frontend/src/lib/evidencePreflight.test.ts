import { describe, expect, it, vi } from 'vitest';
import { validateEvidenceMatchesPackage } from './candidateValidation';
import {
  buildEvidencePreflightInputs,
  isEvidencePreflightCurrent,
  parseEvidenceDocument,
  runEvidencePreflight,
  sha256Hex,
  type EvidenceIdentity,
  type EvidencePreflightSuccess,
} from './evidencePreflight';

const SHA40 = '3f278c3f80a657950873c26145ab1ef867d40af5';
const identity: EvidenceIdentity = {
  packageUid: '0x1e47d7d7079fe4ad599b184559ffcdc56278fb54/updateseal-smoke',
  version: '1.0.1',
  baselineCommitSha: SHA40,
  candidateCommitSha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
};

function validEvidence(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: 2,
    package_uid: identity.packageUid,
    version: identity.version,
    baseline_commit_sha: identity.baselineCommitSha,
    diff_summary: 'Adds logging.',
    changed_files: ['src/index.ts'],
    declared_capabilities: ['network_egress'],
    requested_domains: ['github.com'],
    evidence_items: ['git_diff'],
    tests: [{ name: 'unit', status: 'passed' }],
    ...overrides,
  };
}

describe('evidence schema', () => {
  it('accepts the exact Evidence Schema v2 object', () => {
    const parsed = parseEvidenceDocument(validEvidence(), identity);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.document.schemaVersion).toBe(2);
      expect(parsed.document).not.toHaveProperty('candidateCommitSha');
    }
  });

  it('rejects schema version 1 with a migration message', () => {
    const result = parseEvidenceDocument(validEvidence({ schema_version: 1 }), identity);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('EVIDENCE_SCHEMA_INVALID');
      expect(result.message).toBe('Evidence schema version 1 is obsolete. Generate an Evidence Schema v2 document.');
    }
  });

  it('rejects unknown and missing fields', () => {
    const unknown = parseEvidenceDocument(validEvidence({ extra: true }), identity);
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) {
      expect(unknown.message).toContain("unknown field 'extra'");
    }
    const missing = validEvidence();
    delete (missing as { tests?: unknown }).tests;
    const missingResult = parseEvidenceDocument(missing, identity);
    expect(missingResult.ok).toBe(false);
    if (!missingResult.ok) {
      expect(missingResult.message).toContain("missing field 'tests'");
    }
  });

  it('rejects a candidate_commit_sha document field as unknown', () => {
    const result = parseEvidenceDocument(validEvidence({ candidate_commit_sha: identity.candidateCommitSha }), identity);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('EVIDENCE_SCHEMA_INVALID');
      expect(result.message).toContain("unknown field 'candidate_commit_sha'");
    }
  });

  it('rejects package UID, version, and baseline SHA mismatches', () => {
    const uid = parseEvidenceDocument(validEvidence({ package_uid: `${identity.packageUid}-other` }), identity);
    const version = parseEvidenceDocument(validEvidence({ version: '9.9.9' }), identity);
    const baseline = parseEvidenceDocument(validEvidence({ baseline_commit_sha: 'c'.repeat(40) }), identity);
    expect(uid.ok).toBe(false);
    expect(version.ok).toBe(false);
    expect(baseline.ok).toBe(false);
    if (!uid.ok) {
      expect(uid.code).toBe('EVIDENCE_IDENTITY_MISMATCH');
    }
    if (!version.ok) {
      expect(version.code).toBe('EVIDENCE_IDENTITY_MISMATCH');
    }
    if (!baseline.ok) {
      expect(baseline.code).toBe('EVIDENCE_IDENTITY_MISMATCH');
    }
  });

  it('rejects array limits, duplicates, and invalid test statuses', () => {
    expect(parseEvidenceDocument(validEvidence({ changed_files: Array.from({ length: 101 }, (_, i) => `f${i}`) }), identity).ok).toBe(false);
    expect(parseEvidenceDocument(validEvidence({ declared_capabilities: ['a', 'a'] }), identity).ok).toBe(false);
    expect(parseEvidenceDocument(validEvidence({ requested_domains: [' github.com'] }), identity).ok).toBe(false);
    expect(parseEvidenceDocument(validEvidence({ evidence_items: ['x'.repeat(301)] }), identity).ok).toBe(false);
    expect(parseEvidenceDocument(validEvidence({ tests: [{ name: 'unit', status: 'ok' }] }), identity).ok).toBe(false);
    expect(parseEvidenceDocument(validEvidence({ tests: [{ name: 'unit', status: 'passed', extra: 1 }] }), identity).ok).toBe(false);
    expect(parseEvidenceDocument(validEvidence({ tests: Array.from({ length: 101 }, (_, i) => ({ name: `t${i}`, status: 'passed' })) }), identity).ok).toBe(false);
  });

  it('enforces Unicode code-point boundaries for diff_summary and entries', () => {
    expect(parseEvidenceDocument(validEvidence({ diff_summary: 'x'.repeat(8000) }), identity).ok).toBe(true);
    expect(parseEvidenceDocument(validEvidence({ diff_summary: 'x'.repeat(8001) }), identity).ok).toBe(false);
    expect(parseEvidenceDocument(validEvidence({ evidence_items: ['😀'.repeat(300)] }), identity).ok).toBe(true);
    expect(parseEvidenceDocument(validEvidence({ evidence_items: ['😀'.repeat(301)] }), identity).ok).toBe(false);
    expect(parseEvidenceDocument(validEvidence({ tests: [{ name: 'n'.repeat(200), status: 'skipped' }] }), identity).ok).toBe(true);
    expect(parseEvidenceDocument(validEvidence({ tests: [{ name: 'n'.repeat(201), status: 'failed' }] }), identity).ok).toBe(false);
  });

  it('rejects schema_version other than integer 2', () => {
    expect(parseEvidenceDocument(validEvidence({ schema_version: 3 }), identity).ok).toBe(false);
    expect(parseEvidenceDocument(validEvidence({ schema_version: '2' }), identity).ok).toBe(false);
  });
});

describe('evidence preflight fetch', () => {
  it('fails on non-200 HTTP', async () => {
    const fetchFn = vi.fn(async () => new Response('nope', { status: 404 }));
    const result = await runEvidencePreflight('https://example.test/e.json', 'a'.repeat(64), identity, { fetchFn });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('HTTP_ERROR');
      expect(result.httpStatus).toBe(404);
    }
  });

  it('rejects bodies over 100000 bytes and accepts 100000', async () => {
    const tooBig = vi.fn(async () => new Response('x', { status: 200, headers: { 'content-length': '100001' } }));
    const big = await runEvidencePreflight('https://example.test/e.json', 'a'.repeat(64), identity, { fetchFn: tooBig });
    expect(big.ok).toBe(false);
    if (!big.ok) {
      expect(big.code).toBe('BODY_TOO_LARGE');
    }

    const bytes = new Uint8Array(100000);
    const hash = await sha256Hex(bytes);
    const fetchOk = vi.fn(async () => new Response(bytes, { status: 200, headers: { 'content-length': '100000' } }));
    const cap = await runEvidencePreflight('https://example.test/e.json', hash, identity, { fetchFn: fetchOk });
    expect(cap.ok).toBe(false);
    if (!cap.ok) {
      expect(cap.code === 'UTF8_INVALID' || cap.code === 'JSON_INVALID').toBe(true);
    }
  });

  it('matches SHA-256 of exact raw bytes and rejects mismatch', async () => {
    const json = `${JSON.stringify(validEvidence())}\n`;
    const bytes = new TextEncoder().encode(json);
    const hash = await sha256Hex(bytes);
    const fetchFn = vi.fn(async () => new Response(json, { status: 200 }));
    const ok = await runEvidencePreflight('https://example.test/e.json', hash, identity, { fetchFn });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.computedSha256).toBe(hash);
      expect(ok.bodySize).toBe(bytes.byteLength);
      expect(ok.inputs).toEqual(
        buildEvidencePreflightInputs({
          evidenceUri: 'https://example.test/e.json',
          evidenceHash: hash,
          ...identity,
        }),
      );
    }
    const mismatch = await runEvidencePreflight('https://example.test/e.json', 'c'.repeat(64), identity, { fetchFn });
    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok) {
      expect(mismatch.code).toBe('HASH_MISMATCH');
    }
  });

  it('fails UTF-8 and JSON parse without hashing a reserialized object', async () => {
    const invalidUtf = new Uint8Array([0xff, 0xfe, 0xfd]);
    const utfHash = await sha256Hex(invalidUtf);
    const utfFetch = vi.fn(async () => new Response(invalidUtf, { status: 200 }));
    const utf = await runEvidencePreflight('https://example.test/e.json', utfHash, identity, { fetchFn: utfFetch });
    expect(utf.ok).toBe(false);
    if (!utf.ok) {
      expect(utf.code).toBe('UTF8_INVALID');
    }

    const notJson = '{not json';
    const jsonHash = await sha256Hex(new TextEncoder().encode(notJson));
    const jsonFetch = vi.fn(async () => new Response(notJson, { status: 200 }));
    const json = await runEvidencePreflight('https://example.test/e.json', jsonHash, identity, { fetchFn: jsonFetch });
    expect(json.ok).toBe(false);
    if (!json.ok) {
      expect(json.code).toBe('JSON_INVALID');
    }
  });

  it('passes AbortSignal to fetch and rethrows abort without an HTTP_ERROR result', async () => {
    const controller = new AbortController();
    const fetchFn: typeof fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.signal).toBe(controller.signal);
      controller.abort();
      throw new DOMException('Aborted', 'AbortError');
    });
    await expect(
      runEvidencePreflight('https://example.test/e.json', 'a'.repeat(64), identity, { fetchFn, signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
  });
});

describe('isEvidencePreflightCurrent', () => {
  const inputs = buildEvidencePreflightInputs({
    evidenceUri: 'https://example.test/a.json',
    evidenceHash: 'AA'.repeat(32),
    ...identity,
  });

  function success(overrides: Partial<EvidencePreflightSuccess> = {}): EvidencePreflightSuccess {
    return {
      ok: true,
      httpStatus: 200,
      bodySize: 4,
      computedSha256: inputs.normalizedEvidenceHash,
      expectedSha256: inputs.normalizedEvidenceHash,
      document: {
        schemaVersion: 2,
        packageUid: identity.packageUid,
        version: identity.version,
        baselineCommitSha: identity.baselineCommitSha,
        diffSummary: 'd',
        changedFiles: [],
        declaredCapabilities: [],
        requestedDomains: [],
        evidenceItems: [],
        tests: [],
      },
      inputs,
      ...overrides,
    };
  }

  it('passes an exact matching fingerprint', () => {
    expect(isEvidencePreflightCurrent(success(), inputs)).toBe(true);
  });

  it('detects a URI-only mismatch even when hashes match', () => {
    const otherUri = { ...inputs, evidenceUri: 'https://example.test/b.json' };
    expect(isEvidencePreflightCurrent(success(), otherUri)).toBe(false);
  });

  it('detects hash, package UID, version, baseline SHA, and fingerprint candidate SHA mismatches', () => {
    expect(isEvidencePreflightCurrent(success(), { ...inputs, normalizedEvidenceHash: 'bb'.repeat(32) })).toBe(false);
    expect(isEvidencePreflightCurrent(success(), { ...inputs, packageUid: `${identity.packageUid}-other` })).toBe(false);
    expect(isEvidencePreflightCurrent(success(), { ...inputs, version: '9.9.9' })).toBe(false);
    expect(isEvidencePreflightCurrent(success(), { ...inputs, baselineCommitSha: 'c'.repeat(40) })).toBe(false);
    expect(isEvidencePreflightCurrent(success(), { ...inputs, candidateCommitSha: 'd'.repeat(40) })).toBe(false);
  });

  it('keeps candidate SHA in the fingerprint even though the document omits it', () => {
    expect(inputs.candidateCommitSha).toBe(identity.candidateCommitSha);
    expect(success().document).not.toHaveProperty('candidateCommitSha');
    expect(isEvidencePreflightCurrent(success(), inputs)).toBe(true);
  });
});

describe('candidate SHA URL binding', () => {
  it('rejects a raw GitHub URL whose commit segment does not match the candidate SHA', () => {
    const repo = 'https://github.com/edwarderlick/Provider-Court';
    const matching = `https://raw.githubusercontent.com/edwarderlick/Provider-Court/${identity.candidateCommitSha}/evidence.json`;
    const mismatch = `https://raw.githubusercontent.com/edwarderlick/Provider-Court/${'c'.repeat(40)}/evidence.json`;
    expect(validateEvidenceMatchesPackage(matching, repo, identity.candidateCommitSha)).toBeNull();
    expect(validateEvidenceMatchesPackage(mismatch, repo, identity.candidateCommitSha)).toMatch(/commit must match/);
  });
});
