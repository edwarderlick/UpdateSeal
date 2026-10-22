import { describe, expect, it } from 'vitest';
import { canonicalDecisionPayload, computeDecisionHash } from './decisionHash';

const APPROVED_PAYLOAD = {
  candidate_id: '0xb3f7518df619ef485f7a1568ed3705bb6f5b0407/updateseal@0.1.0-v2-smoke',
  charter_hash: 'c9fdc0131fe857370dd86b80b031cdc2a4520d492d891cd805e6900c10e8e959',
  decision_code: 1,
  decision_name: 'APPROVED',
  evidence_hash: 'e0abffcfc03bcc53fb1a51094de1db934be9460a86d058e745efcb7180ff29ba',
  finding_codes: ['NO_VIOLATION'],
  summary: 'No charter violations were found',
};

describe('canonical decision hash', () => {
  it('recomputes the verified Studio-dev fixture hash', async () => {
    const hash = await computeDecisionHash(APPROVED_PAYLOAD);
    expect(hash).toBe('c69ca06aa7f3b679600751df1fb7f6f11f1bcf1ec4e69e7173e5e45fffa80f97');
  });

  it('does not depend on object insertion order', async () => {
    const reversed = {
      summary: APPROVED_PAYLOAD.summary,
      finding_codes: APPROVED_PAYLOAD.finding_codes,
      evidence_hash: APPROVED_PAYLOAD.evidence_hash,
      decision_name: APPROVED_PAYLOAD.decision_name,
      decision_code: APPROVED_PAYLOAD.decision_code,
      charter_hash: APPROVED_PAYLOAD.charter_hash,
      candidate_id: APPROVED_PAYLOAD.candidate_id,
    };
    expect(canonicalDecisionPayload(reversed)).toBe(canonicalDecisionPayload(APPROVED_PAYLOAD));
    expect(await computeDecisionHash(reversed)).toBe(await computeDecisionHash(APPROVED_PAYLOAD));
  });

  it('encodes Unicode with UTF-8 and ensure_ascii=false behavior', async () => {
    const withUnicode = { ...APPROVED_PAYLOAD, summary: 'café — 日本語' };
    const canonical = canonicalDecisionPayload(withUnicode);
    expect(canonical.includes('café — 日本語')).toBe(true);
    expect(canonical.includes('\\u')).toBe(false);
    const hash = await computeDecisionHash(withUnicode);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toBe('c69ca06aa7f3b679600751df1fb7f6f11f1bcf1ec4e69e7173e5e45fffa80f97');
  });
});
