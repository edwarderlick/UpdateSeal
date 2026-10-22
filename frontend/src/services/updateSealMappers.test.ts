import { describe, expect, it } from 'vitest';
import { UpdateSealError } from '../lib/updateSealErrors';
import { SMOKE_CHARTER_JSON, SMOKE_PACKAGE, SAMPLE_CANDIDATE } from '../test/updateSealFixtures';
import {
  livePackagePath,
  mapCandidateRecord,
  mapPackageRecord,
  normalizeUint,
  parseCharterJson,
} from './updateSealMappers';

describe('updateSealMappers', () => {
  it('8. normalizes integers from number', () => {
    expect(normalizeUint(12, 'sequence')).toBe(12);
  });

  it('9. normalizes integers from bigint', () => {
    expect(normalizeUint(7n, 'sequence')).toBe(7);
  });

  it('10. normalizes integers from a numeric string', () => {
    expect(normalizeUint('42', 'sequence')).toBe(42);
  });

  it('11. rejects a malformed package response', () => {
    expect(() => mapPackageRecord({ package_uid: SMOKE_PACKAGE.package_uid })).toThrow(UpdateSealError);
    try {
      mapPackageRecord({ publisher: 'not-an-address' });
    } catch (error) {
      expect((error as UpdateSealError).code).toBe('CONTRACT_RESPONSE_INVALID');
    }
  });

  it('12. rejects a malformed candidate response', () => {
    expect(() => mapCandidateRecord(null)).toThrow(UpdateSealError);
    expect(() => mapCandidateRecord({ candidate_id: SAMPLE_CANDIDATE.candidate_id })).toThrow(
      /CONTRACT_RESPONSE_INVALID|not a valid/,
    );
  });

  it('13. handles invalid charter JSON without throwing', () => {
    const invalid = parseCharterJson('{not-json');
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) {
      expect(invalid.message).toMatch(/could not be parsed/i);
    }
    const empty = parseCharterJson('');
    expect(empty.ok).toBe(false);
    const parsed = parseCharterJson(SMOKE_CHARTER_JSON);
    expect(parsed.ok).toBe(true);
  });

  it('maps a complete package record and builds a publisher-scoped path', () => {
    expect(mapPackageRecord({ ...SMOKE_PACKAGE, sequence: '0' })).toEqual(SMOKE_PACKAGE);
    expect(livePackagePath(SMOKE_PACKAGE.publisher, SMOKE_PACKAGE.package_slug)).toBe(
      `/packages/${SMOKE_PACKAGE.publisher}/${SMOKE_PACKAGE.package_slug}`,
    );
  });
});
