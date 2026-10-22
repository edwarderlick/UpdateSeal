import type { RegistrationFormData } from '../features/registration/RegistrationContext';
import type { CapabilityCategory } from '../types';
import { buildCanonicalCharter, type CanonicalCharterResult } from './canonicalCharter';

const CAPABILITY_KEYS: readonly CapabilityCategory[] = [
  'network_egress',
  'file_system',
  'process_execution',
  'cryptographic_signing',
  'spending_limits',
  'external_data_export',
];

export function charterInputFromRegistration(form: RegistrationFormData): Record<string, unknown> {
  const allowed: string[] = [];
  const forbidden: string[] = [];

  for (const key of CAPABILITY_KEYS) {
    const rule = form.capabilityCharter[key];
    if (rule.policy === 'PROHIBITED') {
      forbidden.push(key);
    } else {
      allowed.push(key);
    }
  }

  const policyLines = CAPABILITY_KEYS.map((key) => {
    const rule = form.capabilityCharter[key];
    const description = (rule.description ?? '').trim();
    return description ? `${key}: ${rule.policy}. ${description}` : `${key}: ${rule.policy}`;
  });

  const summary = form.description.trim() || form.displayName.trim();
  const policyText = policyLines.join('\n').trim() || summary;

  return {
    schema_version: 1,
    summary,
    allowed_capabilities: allowed,
    forbidden_capabilities: forbidden,
    allowed_domains: form.capabilityCharter.network_egress.allowedDomains ?? [],
    required_evidence: ['git_diff'],
    policy_text: policyText,
  };
}

export function buildCharterFromRegistration(form: RegistrationFormData): CanonicalCharterResult {
  return buildCanonicalCharter(charterInputFromRegistration(form));
}
