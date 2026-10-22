import { describe, expect, it } from 'vitest';
import { parseCandidateId, parsePackageUidAndVersion } from './candidateId';

const OFFICIAL =
  '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal@0.1.0-v2-smoke';

describe('parseCandidateId', () => {
  it('parses a valid candidate ID and normalizes the publisher address', () => {
    const parsed = parseCandidateId(`  ${OFFICIAL}  `);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.candidateId).toBe(OFFICIAL);
      expect(parsed.packageUid).toBe('0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal');
      expect(parsed.version).toBe('0.1.0-v2-smoke');
    }
  });

  it('rejects missing @, empty version, slash in version, and inner whitespace', () => {
    expect(parseCandidateId('0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal').ok).toBe(false);
    expect(parseCandidateId('0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal@').ok).toBe(false);
    expect(parseCandidateId('0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal@0.1/0').ok).toBe(false);
    expect(parseCandidateId('0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal@0.1 0').ok).toBe(false);
    expect(parseCandidateId('pkg uid@1.0.0').ok).toBe(false);
  });

  it('rejects extra @ separators and does not lowercase versions or slugs', () => {
    expect(parseCandidateId('0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal@1.0@beta').ok).toBe(false);
    const mixed = parseCandidateId('0xB3F7518DF619EF485F7A1568ED3705BB6F5B0407/updateseal@0.1.0-v2-smoke');
    expect(mixed.ok).toBe(true);
    if (mixed.ok) {
      expect(mixed.packageSlug).toBe('updateseal');
      expect(mixed.version).toBe('0.1.0-v2-smoke');
      expect(mixed.publisher).toBe('0xb3f7518df619ef485f7a1568ed3705bb6f5b0407');
    }
  });
});

describe('parsePackageUidAndVersion', () => {
  it('resolves a candidate ID from package UID and version', () => {
    const parsed = parsePackageUidAndVersion(
      '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal',
      '0.1.0-v2-smoke',
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.candidateId).toBe(OFFICIAL);
    }
  });
});
