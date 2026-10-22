import { describe, expect, it } from 'vitest';
import {
  derivePackageUid,
  liveCandidateDecisionPath,
  livePackagePath,
  validateCommitSha,
  validateGithubRepositoryUrl,
  validatePackageSlug,
} from './registrationValidation';

describe('registration validation', () => {
  it('accepts a contract-valid package slug', () => {
    expect(validatePackageSlug('sentinel-code-auditor')).toBeNull();
    expect(validatePackageSlug('ab')).toMatch(/3 and 80/);
    expect(validatePackageSlug('Agent')).toMatch(/lowercase/);
    expect(validatePackageSlug('agent:sentinel')).toMatch(/invalid characters/);
    expect(validatePackageSlug('has/slash')).toMatch(/'\/' or '@'/);
    expect(validatePackageSlug('has@at')).toMatch(/'\/' or '@'/);
    expect(validatePackageSlug(' has-space')).toMatch(/trimmed form/);
    expect(validatePackageSlug('has space')).toMatch(/whitespace or control/);
    expect(validatePackageSlug('-leading')).toMatch(/begin and end/);
    expect(validatePackageSlug('trailing-')).toMatch(/begin and end/);
  });

  it('enforces the contract GitHub repository URL rules', () => {
    expect(validateGithubRepositoryUrl('https://github.com/sentinel-sec/code-auditor')).toBeNull();
    expect(validateGithubRepositoryUrl('https://github.com/sentinel-sec/code-auditor.git')).toBeNull();
    expect(validateGithubRepositoryUrl('https://github.com/sentinel-sec/code-auditor/')).toBeNull();
    expect(validateGithubRepositoryUrl('http://github.com/sentinel-sec/code-auditor')).toMatch(/HTTPS/);
    expect(validateGithubRepositoryUrl('https://www.github.com/sentinel-sec/code-auditor')).toMatch(/github.com/);
    expect(validateGithubRepositoryUrl('https://github.com/sentinel-sec/code-auditor?x=1')).toMatch(/query/);
    expect(validateGithubRepositoryUrl('https://github.com/sentinel-sec/code-auditor#frag')).toMatch(/fragment/);
    expect(validateGithubRepositoryUrl('https://user:pass@github.com/sentinel-sec/code-auditor')).toMatch(/credentials/);
    expect(validateGithubRepositoryUrl('https://github.com:444/sentinel-sec/code-auditor')).toMatch(/custom port/);
    expect(validateGithubRepositoryUrl('https://github.com/sentinel-sec/code-auditor/extra')).toMatch(/owner/);
    expect(validateGithubRepositoryUrl('https://github.com/sentinel-sec/code%2Fauditor')).toMatch(/percent-encoded/);
    expect(validateGithubRepositoryUrl('https://gitlab.com/sentinel-sec/code-auditor')).toMatch(/github.com/);
  });

  it('accepts 40- or 64-character hex SHAs without lowercasing', () => {
    expect(validateCommitSha('4f89a29e81bfa0021c38e9184b2910cbe8822910')).toBeNull();
    expect(validateCommitSha('4F89A29E81BFA0021C38E9184B2910CBE8822910')).toBeNull();
    expect(validateCommitSha('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')).toBeNull();
    expect(validateCommitSha('abcd')).toMatch(/40- or 64-character/);
    expect(validateCommitSha('zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz')).toMatch(/hexadecimal characters/);
  });

  it('derives publisher-scoped package UIDs and live paths', () => {
    expect(derivePackageUid('0x1E47D7D7079FE4AD599B184559FFCDC56278FB54', 'updateseal-smoke')).toBe(
      '0x1e47d7d7079fe4ad599b184559ffcdc56278fb54/updateseal-smoke',
    );
    expect(livePackagePath('0x1E47D7D7079FE4AD599B184559FFCDC56278FB54', 'updateseal-smoke')).toBe(
      '/packages/0x1e47d7d7079fe4ad599b184559ffcdc56278fb54/updateseal-smoke',
    );
  });

  it('builds live candidate decision and review paths', () => {
    expect(
      liveCandidateDecisionPath(
        '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407',
        'updateseal',
        '0.1.0-v2-smoke',
      ),
    ).toBe(
      '/packages/0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal/candidates/0.1.0-v2-smoke/decision',
    );
  });
});
