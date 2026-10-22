import { describe, expect, it } from 'vitest';
import {
  buildCanonicalCharter,
  CHARTER_ARRAY_MAX,
  CHARTER_ENTRY_MAX,
  CHARTER_POLICY_MAX,
  CHARTER_SUMMARY_MAX,
  unicodeCodePointLength,
} from './canonicalCharter';
import { dumpsCanonical } from './canonicalJson';

const BASE = {
  schema_version: 1,
  summary: 'Smoke-test charter for UpdateSealRegistry on Studio-dev.',
  allowed_capabilities: ['network_egress'],
  forbidden_capabilities: ['process_execution'],
  allowed_domains: ['github.com'],
  required_evidence: ['git_diff'],
  policy_text: 'Do not expand capabilities without a new charter.',
};

describe('canonical charter builder', () => {
  it('serializes with recursively sorted keys and compact separators', () => {
    const result = buildCanonicalCharter({
      policy_text: BASE.policy_text,
      summary: BASE.summary,
      required_evidence: BASE.required_evidence,
      schema_version: 1,
      forbidden_capabilities: BASE.forbidden_capabilities,
      allowed_domains: BASE.allowed_domains,
      allowed_capabilities: BASE.allowed_capabilities,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.json).toBe(
      '{"allowed_capabilities":["network_egress"],"allowed_domains":["github.com"],"forbidden_capabilities":["process_execution"],"policy_text":"Do not expand capabilities without a new charter.","required_evidence":["git_diff"],"schema_version":1,"summary":"Smoke-test charter for UpdateSealRegistry on Studio-dev."}',
    );
    expect(result.json).toBe(dumpsCanonical(result.charter));
    expect(result.json.includes(': ')).toBe(false);
    expect(result.json.includes(', ')).toBe(false);
  });

  it('matches Python-style json.dumps for a Unicode charter', () => {
    const result = buildCanonicalCharter({
      schema_version: 1,
      summary: '日本語 café 🔒',
      allowed_capabilities: ['network_egress'],
      forbidden_capabilities: ['process_execution'],
      allowed_domains: ['github.com'],
      required_evidence: ['git_diff'],
      policy_text: 'Do not expand. 日本語',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const expected =
      '{"allowed_capabilities":["network_egress"],"allowed_domains":["github.com"],"forbidden_capabilities":["process_execution"],"policy_text":"Do not expand. 日本語","required_evidence":["git_diff"],"schema_version":1,"summary":"日本語 café 🔒"}';
    expect(result.json).toBe(expected);
    expect(result.json).toContain('日本語');
    expect(result.json).toContain('café');
    expect(result.json).toContain('🔒');
    expect(result.json).not.toContain('\\u');
  });

  it('trims strings and array entries, removes blanks, and preserves order', () => {
    const result = buildCanonicalCharter({
      schema_version: 1,
      summary: '  keep this summary  ',
      allowed_capabilities: [' network_egress ', '', 'file_system'],
      forbidden_capabilities: ['process_execution'],
      allowed_domains: [' github.com ', '  '],
      required_evidence: ['git_diff'],
      policy_text: '  policy  ',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.charter.summary).toBe('keep this summary');
    expect(result.charter.allowed_capabilities).toEqual(['network_egress', 'file_system']);
    expect(result.charter.allowed_domains).toEqual(['github.com']);
    expect(result.charter.policy_text).toBe('policy');
  });

  it('rejects duplicate array entries rather than uniquing them', () => {
    const result = buildCanonicalCharter({
      ...BASE,
      allowed_capabilities: ['network_egress', 'network_egress'],
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.allowed_capabilities).toMatch(/duplicate entries/);
  });

  it('rejects unknown and missing fields', () => {
    const missing = buildCanonicalCharter({ schema_version: 1, summary: 'x' });
    expect(missing.ok).toBe(false);
    const extra = buildCanonicalCharter({ ...BASE, extra_field: 'nope' });
    expect(extra.ok).toBe(false);
    if (!extra.ok) {
      expect(extra.errors.extra_field).toMatch(/unknown field/);
    }
  });

  it('enforces charter length and entry limits', () => {
    const longSummary = buildCanonicalCharter({
      ...BASE,
      summary: 's'.repeat(CHARTER_SUMMARY_MAX + 1),
    });
    expect(longSummary.ok).toBe(false);

    const longPolicy = buildCanonicalCharter({
      ...BASE,
      policy_text: 'p'.repeat(CHARTER_POLICY_MAX + 1),
    });
    expect(longPolicy.ok).toBe(false);

    const tooMany = buildCanonicalCharter({
      ...BASE,
      allowed_capabilities: Array.from({ length: CHARTER_ARRAY_MAX + 1 }, (_, i) => `cap-${i}`),
    });
    expect(tooMany.ok).toBe(false);

    const longEntry = buildCanonicalCharter({
      ...BASE,
      allowed_domains: ['d'.repeat(CHARTER_ENTRY_MAX + 1)],
    });
    expect(longEntry.ok).toBe(false);
  });

  it('requires integer schema_version 1', () => {
    expect(buildCanonicalCharter({ ...BASE, schema_version: 2 }).ok).toBe(false);
    expect(buildCanonicalCharter({ ...BASE, schema_version: '1' }).ok).toBe(false);
    expect(buildCanonicalCharter({ ...BASE, schema_version: 1.5 }).ok).toBe(false);
  });

  it('counts supplementary Unicode as one Python-style code point', () => {
    expect(unicodeCodePointLength('🔒')).toBe(1);
    expect('🔒'.length).toBe(2);
    expect(unicodeCodePointLength('日本語 café 🔒')).toBe(10);

    const summaryAtMax = buildCanonicalCharter({
      ...BASE,
      summary: '🔒'.repeat(CHARTER_SUMMARY_MAX),
    });
    expect(summaryAtMax.ok).toBe(true);

    const summaryOver = buildCanonicalCharter({
      ...BASE,
      summary: '🔒'.repeat(CHARTER_SUMMARY_MAX + 1),
    });
    expect(summaryOver.ok).toBe(false);

    const policyAtMax = buildCanonicalCharter({
      ...BASE,
      policy_text: '🔒'.repeat(CHARTER_POLICY_MAX),
    });
    expect(policyAtMax.ok).toBe(true);

    const policyOver = buildCanonicalCharter({
      ...BASE,
      policy_text: '🔒'.repeat(CHARTER_POLICY_MAX + 1),
    });
    expect(policyOver.ok).toBe(false);

    const entryAtMax = buildCanonicalCharter({
      ...BASE,
      allowed_domains: ['🔒'.repeat(CHARTER_ENTRY_MAX)],
    });
    expect(entryAtMax.ok).toBe(true);

    const entryOver = buildCanonicalCharter({
      ...BASE,
      allowed_domains: ['🔒'.repeat(CHARTER_ENTRY_MAX + 1)],
    });
    expect(entryOver.ok).toBe(false);

    const jsonOver = buildCanonicalCharter({
      ...BASE,
      summary: '🔒'.repeat(CHARTER_SUMMARY_MAX),
      policy_text: '🔒'.repeat(CHARTER_POLICY_MAX),
      allowed_capabilities: Array.from({ length: CHARTER_ARRAY_MAX }, (_, i) => `${'🔒'.repeat(180)}-${i}`),
    });
    expect(jsonOver.ok).toBe(false);
    if (!jsonOver.ok) {
      expect(jsonOver.errors.charter).toMatch(/12,000 characters/);
    }
  });
});
