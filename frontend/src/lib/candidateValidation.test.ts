import { describe, expect, it } from 'vitest';
import {
  deriveCandidateId,
  isSemverRecommendation,
  normalizeEvidenceHash,
  parseRawGithubEvidence,
  unicodeCodePointLength,
  validateCandidateCommitSha,
  validateEvidenceMatchesPackage,
  validateVersion,
} from './candidateValidation';

const SHA40 = '3f278c3f80a657950873c26145ab1ef867d40af5';
const SHA64 = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const REPO = 'https://github.com/edwarderlick/Provider-Court';

describe('candidateValidation', () => {
  it('accepts contract version rules and rejects extra characters', () => {
    expect(validateVersion('1')).toBeNull();
    expect(validateVersion('v1.5.0-rc1')).toBeNull();
    expect(validateVersion('A.B+C-1')).toBeNull();
    expect(validateVersion('a'.repeat(40))).toBeNull();
    expect(validateVersion('a'.repeat(41))).toMatch(/1 and 40/);
    expect(validateVersion('')).toMatch(/1 and 40/);
    expect(validateVersion(' 1.0.0')).toMatch(/trimmed form/);
    expect(validateVersion('1.0.0 ')).toMatch(/trimmed form/);
    expect(validateVersion('1 0')).toMatch(/whitespace or control/);
    expect(validateVersion('1.0/1')).toMatch(/'\/' or '@'/);
    expect(validateVersion('1.0@1')).toMatch(/'\/' or '@'/);
    expect(validateVersion('1.0_1')).toMatch(/invalid characters/);
    expect(validateVersion('1.0:1')).toMatch(/invalid characters/);
  });

  it('does not require SemVer; SemVer is a recommendation only', () => {
    expect(validateVersion('not-semver')).toBeNull();
    expect(isSemverRecommendation('not-semver')).toBe(false);
    expect(isSemverRecommendation('v1.5.0-rc1')).toBe(true);
  });

  it('accepts 40- and 64-character candidate SHAs and preserves case', () => {
    expect(validateCandidateCommitSha(SHA40)).toBeNull();
    expect(validateCandidateCommitSha(SHA64)).toBeNull();
    expect(validateCandidateCommitSha('ABCDEF0123ABCDEF0123ABCDEF0123ABCDEF0123')).toBeNull();
    expect(validateCandidateCommitSha(SHA40.slice(0, 39))).toMatch(/40- or 64/);
    expect(validateCandidateCommitSha(`${SHA40}0`)).toMatch(/40- or 64/);
    expect(validateCandidateCommitSha('zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz')).toMatch(/hexadecimal/);
  });

  it('normalizes evidence hash to lowercase 64 hex', () => {
    const upper = 'B'.repeat(64);
    const result = normalizeEvidenceHash(upper);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.hash).toBe('b'.repeat(64));
    }
    expect(normalizeEvidenceHash('c'.repeat(63)).ok).toBe(false);
    expect(normalizeEvidenceHash('g'.repeat(64)).ok).toBe(false);
  });

  it('parses a canonical raw GitHub evidence URI', () => {
    const uri = `https://raw.githubusercontent.com/edwarderlick/Provider-Court/${SHA40}/updateseal/evidence.json`;
    const parsed = parseRawGithubEvidence(uri);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.parsed).toEqual({
        owner: 'edwarderlick',
        repo: 'Provider-Court',
        commitSha: SHA40,
        filePath: 'updateseal/evidence.json',
      });
    }
    expect(validateEvidenceMatchesPackage(uri, REPO, SHA40)).toBeNull();
  });

  it('requires owner, repository, and commit to match the package', () => {
    const uri = `https://raw.githubusercontent.com/other/Provider-Court/${SHA40}/evidence.json`;
    expect(validateEvidenceMatchesPackage(uri, REPO, SHA40)).toMatch(/owner must match/);
    const uriRepo = `https://raw.githubusercontent.com/edwarderlick/Other-Repo/${SHA40}/evidence.json`;
    expect(validateEvidenceMatchesPackage(uriRepo, REPO, SHA40)).toMatch(/repository must match/);
    const uriSha = `https://raw.githubusercontent.com/edwarderlick/Provider-Court/${SHA64}/evidence.json`;
    expect(validateEvidenceMatchesPackage(uriSha, REPO, SHA40)).toMatch(/commit must match/);
  });

  it('rejects percent encoding, traversal, doubled slash, backslash, query, fragment, credentials, and port', () => {
    const base = `https://raw.githubusercontent.com/edwarderlick/Provider-Court/${SHA40}/evidence.json`;
    const rejected = [
      base.replace('evidence.json', 'ev%69dence.json'),
      `https://raw.githubusercontent.com/edwarderlick/Provider-Court/${SHA40}/../evidence.json`,
      `https://raw.githubusercontent.com/edwarderlick/Provider-Court/${SHA40}/./evidence.json`,
      `https://raw.githubusercontent.com/edwarderlick/Provider-Court/${SHA40}//evidence.json`,
      `https://raw.githubusercontent.com/edwarderlick/Provider-Court/${SHA40}/foo\\bar.json`,
      `${base}?x=1`,
      `${base}#frag`,
      `https://user:pass@raw.githubusercontent.com/edwarderlick/Provider-Court/${SHA40}/evidence.json`,
      `https://raw.githubusercontent.com:444/edwarderlick/Provider-Court/${SHA40}/evidence.json`,
      'http://raw.githubusercontent.com/edwarderlick/Provider-Court/sha/path',
      'https://github.com/edwarderlick/Provider-Court/raw/main/evidence.json',
      `https://raw.githubusercontent.com/edwarderlick/Provider-Court/${SHA40}/`,
    ];
    for (const uri of rejected) {
      expect(parseRawGithubEvidence(uri).ok, uri).toBe(false);
    }
  });

  it('rejects URIs longer than 500 Unicode code points', () => {
    const prefix = `https://raw.githubusercontent.com/edwarderlick/Provider-Court/${SHA40}/`;
    const path = 'a'.repeat(501 - prefix.length);
    expect(unicodeCodePointLength(prefix + path)).toBe(501);
    expect(parseRawGithubEvidence(prefix + path).ok).toBe(false);
  });

  it('derives candidate_id as package_uid@version', () => {
    expect(deriveCandidateId('0xabc/slug', '1.0.1')).toBe('0xabc/slug@1.0.1');
  });
});
