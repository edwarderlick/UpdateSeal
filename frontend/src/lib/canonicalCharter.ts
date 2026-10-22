import type { CharterV1 } from '../types/updateSeal';
import { dumpsCanonical } from './canonicalJson';

export const CHARTER_REQUIRED_FIELDS = [
  'schema_version',
  'summary',
  'allowed_capabilities',
  'forbidden_capabilities',
  'allowed_domains',
  'required_evidence',
  'policy_text',
] as const;

export const CHARTER_ARRAY_FIELDS = [
  'allowed_capabilities',
  'forbidden_capabilities',
  'allowed_domains',
  'required_evidence',
] as const;

export const CHARTER_MAX_CHARS = 12000;
export const CHARTER_SUMMARY_MAX = 500;
export const CHARTER_POLICY_MAX = 4000;
export const CHARTER_ARRAY_MAX = 50;
export const CHARTER_ENTRY_MAX = 200;
export const CHARTER_SCHEMA_VERSION = 1;

export type CanonicalCharterSuccess = {
  ok: true;
  charter: CharterV1;
  json: string;
};

export type CanonicalCharterFailure = {
  ok: false;
  errors: Record<string, string>;
};

export type CanonicalCharterResult = CanonicalCharterSuccess | CanonicalCharterFailure;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function addError(errors: Record<string, string>, field: string, message: string): void {
  if (!errors[field]) {
    errors[field] = message;
  }
}

/** Python `len(str)` semantics: Unicode code points, not UTF-16 code units or UTF-8 bytes. */
export function unicodeCodePointLength(value: string): number {
  return Array.from(value).length;
}

function normalizeStringField(
  name: string,
  value: unknown,
  minLen: number,
  maxLen: number,
  errors: Record<string, string>,
): string {
  if (typeof value !== 'string') {
    addError(errors, name, `Charter field '${name}' must be a string`);
    return '';
  }
  const trimmed = value.trim();
  const length = unicodeCodePointLength(trimmed);
  if (length < minLen || length > maxLen) {
    addError(errors, name, `Charter field '${name}' must be between ${minLen} and ${maxLen} characters`);
  }
  return trimmed;
}

function normalizeArrayField(name: string, value: unknown, errors: Record<string, string>): string[] {
  if (!Array.isArray(value)) {
    addError(errors, name, `Charter field '${name}' must be an array`);
    return [];
  }

  const normalized: string[] = [];
  const seen: string[] = [];

  for (const item of value) {
    if (typeof item !== 'string') {
      addError(
        errors,
        name,
        `Charter array entry in '${name}' must be a non-empty trimmed string of at most ${CHARTER_ENTRY_MAX} characters`,
      );
      continue;
    }
    const trimmed = item.trim();
    if (unicodeCodePointLength(trimmed) === 0) {
      continue;
    }
    if (unicodeCodePointLength(trimmed) > CHARTER_ENTRY_MAX) {
      addError(
        errors,
        name,
        `Charter array entry in '${name}' must be a non-empty trimmed string of at most ${CHARTER_ENTRY_MAX} characters`,
      );
      continue;
    }
    if (seen.includes(trimmed)) {
      addError(errors, name, `Charter field '${name}' contains duplicate entries`);
      continue;
    }
    seen.push(trimmed);
    normalized.push(trimmed);
  }

  if (normalized.length > CHARTER_ARRAY_MAX) {
    addError(errors, name, `Charter field '${name}' must contain at most ${CHARTER_ARRAY_MAX} entries`);
  }

  return normalized;
}

export function buildCanonicalCharter(input: unknown): CanonicalCharterResult {
  const errors: Record<string, string> = {};

  if (!isPlainObject(input)) {
    return { ok: false, errors: { charter: 'Charter JSON must be an object' } };
  }

  for (const key of Object.keys(input)) {
    if (!(CHARTER_REQUIRED_FIELDS as readonly string[]).includes(key)) {
      addError(errors, key, `Charter JSON contains unknown field '${key}'`);
    }
  }

  for (const required of CHARTER_REQUIRED_FIELDS) {
    if (!(required in input)) {
      addError(errors, required, `Charter JSON is missing required field '${required}'`);
    }
  }

  const schemaVersion = input.schema_version;
  if (typeof schemaVersion !== 'number' || !Number.isInteger(schemaVersion) || schemaVersion !== CHARTER_SCHEMA_VERSION) {
    addError(errors, 'schema_version', 'Charter JSON must use schema version 1');
  }

  const summary = normalizeStringField('summary', input.summary ?? '', 1, CHARTER_SUMMARY_MAX, errors);
  const policyText = normalizeStringField('policy_text', input.policy_text ?? '', 1, CHARTER_POLICY_MAX, errors);

  const allowedCapabilities = normalizeArrayField(
    'allowed_capabilities',
    input.allowed_capabilities ?? [],
    errors,
  );
  const forbiddenCapabilities = normalizeArrayField(
    'forbidden_capabilities',
    input.forbidden_capabilities ?? [],
    errors,
  );
  const allowedDomains = normalizeArrayField('allowed_domains', input.allowed_domains ?? [], errors);
  const requiredEvidence = normalizeArrayField('required_evidence', input.required_evidence ?? [], errors);

  const charter: CharterV1 = {
    schema_version: 1,
    summary,
    allowed_capabilities: allowedCapabilities,
    forbidden_capabilities: forbiddenCapabilities,
    allowed_domains: allowedDomains,
    required_evidence: requiredEvidence,
    policy_text: policyText,
  };

  const json = dumpsCanonical(charter);
  const jsonLength = unicodeCodePointLength(json);
  if (jsonLength < 1 || jsonLength > CHARTER_MAX_CHARS) {
    addError(errors, 'charter', 'Charter JSON must be between 1 and 12,000 characters');
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, charter, json };
}
