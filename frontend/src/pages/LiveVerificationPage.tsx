import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, ExternalLink, ShieldAlert, Terminal } from 'lucide-react';
import { CopyButton } from '../components/ui/CopyButton';
import { DataModeBadge } from '../components/ui/DataModeBadge';
import { HashField } from '../components/decision/HashField';
import { useLiveReleaseVerification } from '../features/registry/registryQueries';
import { parseCandidateId, parsePackageUidAndVersion } from '../lib/candidateId';
import { liveCandidateDecisionPath, livePackagePath } from '../lib/registrationValidation';
import { getUpdateSealConfigResult } from '../lib/updateSealConfig';
import { logUpdateSealError, toUpdateSealError } from '../lib/updateSealErrors';
import {
  stringifyMachineReadableResult,
  verifyEvidenceBytes,
  type EvidenceBytesOutcome,
  type VerifyLookupInput,
  type VerifyReleaseResult,
} from '../lib/verifyRelease';
import { safeExternalHref } from '../lib/decisionReport';

type LookupMode = 'candidate' | 'package';

function lookupFromSearch(searchParams: URLSearchParams): {
  mode: LookupMode;
  candidateDraft: string;
  packageDraft: string;
  versionDraft: string;
  input: VerifyLookupInput | null;
  error: string | null;
} {
  const candidateRaw = searchParams.get('candidate');
  const packageRaw = searchParams.get('package');
  const versionRaw = searchParams.get('version');
  if (candidateRaw !== null && candidateRaw.length > 0) {
    const parsed = parseCandidateId(candidateRaw);
    if (!parsed.ok) {
      return {
        mode: 'candidate',
        candidateDraft: candidateRaw,
        packageDraft: packageRaw ?? '',
        versionDraft: versionRaw ?? '',
        input: null,
        error: parsed.message,
      };
    }
    return {
      mode: 'candidate',
      candidateDraft: candidateRaw,
      packageDraft: parsed.displayPackageUid,
      versionDraft: parsed.version,
      input: {
        mode: 'candidate',
        candidateId: parsed.candidateId,
        packageUid: parsed.packageUid,
        version: parsed.version,
      },
      error: null,
    };
  }
  if ((packageRaw && packageRaw.length > 0) || (versionRaw && versionRaw.length > 0)) {
    const parsed = parsePackageUidAndVersion(packageRaw ?? '', versionRaw ?? '');
    if (!parsed.ok) {
      return {
        mode: 'package',
        candidateDraft: '',
        packageDraft: packageRaw ?? '',
        versionDraft: versionRaw ?? '',
        input: null,
        error: parsed.message,
      };
    }
    return {
      mode: 'package',
      candidateDraft: parsed.displayCandidateId,
      packageDraft: packageRaw ?? '',
      versionDraft: versionRaw ?? '',
      input: {
        mode: 'package',
        candidateId: parsed.candidateId,
        packageUid: parsed.packageUid,
        version: parsed.version,
      },
      error: null,
    };
  }
  return {
    mode: 'candidate',
    candidateDraft: '',
    packageDraft: '',
    versionDraft: '',
    input: null,
    error: null,
  };
}

function PublicField({ label, value, testId }: { label: string; value: string; testId?: string }) {
  return (
    <div className="bg-white border-2 border-brand-charcoal p-4 shadow-[2px_2px_0px_#0B130E]">
      <span className="font-mono text-[10px] uppercase font-bold text-stone-500">{label}</span>
      <div className="mt-1 flex items-start justify-between gap-2">
        <span className="break-all font-mono text-xs font-bold" data-testid={testId}>
          {value || '(empty)'}
        </span>
        {value ? <CopyButton text={value} label="Copy" /> : null}
      </div>
    </div>
  );
}

function NetworkError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const parsed = toUpdateSealError(error);
  logUpdateSealError(parsed);
  return (
    <div className="bg-white border-2 border-brand-charcoal p-8 space-y-3" data-testid="live-verify-network-error" role="alert">
      <h2 className="text-2xl font-black uppercase">NETWORK/CONFIGURATION ERROR</h2>
      <p className="text-xs font-mono">{parsed.userMessage}</p>
      <button
        type="button"
        onClick={onRetry}
        className="bg-brand-orange text-white px-4 py-2 text-xs font-bold uppercase border border-brand-charcoal"
      >
        Retry
      </button>
    </div>
  );
}

function headlineTone(headline: string): string {
  if (headline === 'VERIFIED — APPROVED') {
    return 'bg-brand-vibrantCyan text-brand-charcoal';
  }
  if (headline === 'VERIFIED — REVIEW REQUIRED') {
    return 'bg-brand-pastelYellow text-brand-charcoal';
  }
  if (headline === 'VERIFIED — VIOLATION') {
    return 'bg-brand-orange text-white';
  }
  if (headline === 'VERIFIED — EVIDENCE UNAVAILABLE') {
    return 'bg-brand-forest text-white';
  }
  if (headline === 'PENDING — NO FINAL DECISION') {
    return 'bg-brand-charcoal text-white';
  }
  if (headline === 'RELEASE NOT FOUND') {
    return 'bg-stone-200 text-brand-charcoal';
  }
  return 'bg-white text-brand-charcoal';
}

export const LiveVerificationPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const parsedSearch = useMemo(() => lookupFromSearch(searchParams), [searchParams]);
  const [mode, setMode] = useState<LookupMode>(parsedSearch.mode);
  const [candidateDraft, setCandidateDraft] = useState(parsedSearch.candidateDraft);
  const [packageDraft, setPackageDraft] = useState(parsedSearch.packageDraft);
  const [versionDraft, setVersionDraft] = useState(parsedSearch.versionDraft);
  const [formError, setFormError] = useState<string | null>(parsedSearch.error);
  const [evidenceOutcome, setEvidenceOutcome] = useState<EvidenceBytesOutcome | null>(null);
  const [evidenceBusy, setEvidenceBusy] = useState(false);

  useEffect(() => {
    setMode(parsedSearch.mode);
    setCandidateDraft(parsedSearch.candidateDraft);
    setPackageDraft(parsedSearch.packageDraft);
    setVersionDraft(parsedSearch.versionDraft);
    setFormError(parsedSearch.error);
    setEvidenceOutcome(null);
  }, [parsedSearch]);

  const query = useLiveReleaseVerification(parsedSearch.input);
  const configResult = getUpdateSealConfigResult();
  const contractAddress = configResult.ok ? configResult.config.contractAddress : '';

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === 'candidate') {
      const parsed = parseCandidateId(candidateDraft);
      if (!parsed.ok) {
        setFormError(parsed.message);
        return;
      }
      setFormError(null);
      setSearchParams({ candidate: parsed.candidateId });
      return;
    }
    const parsed = parsePackageUidAndVersion(packageDraft, versionDraft);
    if (!parsed.ok) {
      setFormError(parsed.message);
      return;
    }
    setFormError(null);
    setSearchParams({ package: parsed.packageUid, version: parsed.version });
  };

  const result = query.data;
  const shareUrl =
    parsedSearch.input && typeof window !== 'undefined'
      ? `${window.location.origin}/verify?candidate=${encodeURIComponent(parsedSearch.input.candidateId)}`
      : '';

  const runEvidence = async (current: Extract<VerifyReleaseResult, { candidate: unknown }>) => {
    setEvidenceBusy(true);
    const outcome = await verifyEvidenceBytes({
      evidenceUri: current.candidate.evidence_uri,
      evidenceHash: current.candidate.evidence_hash,
      repositoryUrl: current.packageRecord.repository_url,
      candidateCommitSha: current.candidate.candidate_commit_sha,
    });
    setEvidenceOutcome(outcome);
    setEvidenceBusy(false);
  };

  return (
    <div className="flex flex-col w-full pb-16" data-testid="live-verification-page">
      <section className="relative w-full bg-brand-cream border-b-2 border-brand-charcoal py-12 px-6 lg:px-12">
        <div className="max-w-[1360px] mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 text-brand-charcoal border-b border-brand-charcoal/20 mb-8 font-mono text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="uppercase tracking-widest bg-brand-forest text-brand-pastelYellow px-2.5 py-1 border border-brand-charcoal font-bold shadow-[2px_2px_0px_#0B130E]">
                GENLAYER::RPC::61997
              </span>
              <span className="uppercase tracking-widest text-stone-600 font-semibold">
                GATEWAY: VERIFY_RELEASE_STATE
              </span>
            </div>
            <DataModeBadge />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8 space-y-4">
              <h1 className="font-sans font-black text-4xl lg:text-6xl text-brand-charcoal tracking-tighter uppercase leading-[0.95]">
                CHECK BEFORE
                <br />
                <span className="text-brand-orange underline decoration-brand-charcoal decoration-4 underline-offset-8">
                  YOU ACTIVATE.
                </span>
              </h1>
              <p className="font-sans text-base text-stone-700 max-w-2xl pt-2 leading-relaxed font-medium">
                Public Studio-dev verification. No wallet is required. “Verified” means the on-chain record and its
                decision fields were read and validated. It does not mean every status is approved. Studio-dev is a
                preview network and may reset.
              </p>
            </div>
            <div className="lg:col-span-4 bg-brand-forest text-white p-6 border-2 border-brand-charcoal shadow-[6px_6px_0px_#0B130E]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-widest text-brand-pastelYellow font-bold">
                  Lookup methods
                </span>
                <Terminal className="w-5 h-5 text-brand-orange" />
              </div>
              <p className="text-sm font-bold uppercase mt-3">Candidate ID</p>
              <p className="text-sm font-bold uppercase">Package UID + version</p>
              <p className="text-xs text-stone-300 mt-3">
                Transaction hash, repository URL, and decision hash are not searchable indexes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-brand-cream border-b-2 border-brand-charcoal py-12 px-6 lg:px-12">
        <div className="max-w-[1360px] mx-auto">
          <div className="bg-white border-2 border-brand-charcoal shadow-[8px_8px_0px_#0B130E] p-6 lg:p-10">
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                type="button"
                onClick={() => setMode('candidate')}
                className={`px-4 py-2 font-mono text-xs font-bold uppercase border-2 border-brand-charcoal shadow-[2px_2px_0px_#0B130E] ${
                  mode === 'candidate' ? 'bg-brand-forest text-white' : 'bg-white text-brand-charcoal'
                }`}
              >
                Candidate ID
              </button>
              <button
                type="button"
                onClick={() => setMode('package')}
                className={`px-4 py-2 font-mono text-xs font-bold uppercase border-2 border-brand-charcoal shadow-[2px_2px_0px_#0B130E] ${
                  mode === 'package' ? 'bg-brand-forest text-white' : 'bg-white text-brand-charcoal'
                }`}
              >
                Package UID + version
              </button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
              {mode === 'candidate' ? (
                <div className="lg:col-span-9 space-y-2">
                  <label className="block font-mono text-xs uppercase tracking-wider font-bold" htmlFor="verify-candidate-id">
                    Candidate ID
                  </label>
                  <input
                    id="verify-candidate-id"
                    value={candidateDraft}
                    onChange={(event) => setCandidateDraft(event.target.value)}
                    placeholder="0xb3…/updateseal@0.1.0-v2-smoke"
                    className="w-full px-4 py-3 bg-stone-50 font-mono text-sm border-2 border-brand-charcoal focus:outline-none focus:bg-white shadow-[2px_2px_0px_#0B130E]"
                  />
                </div>
              ) : (
                <>
                  <div className="lg:col-span-6 space-y-2">
                    <label className="block font-mono text-xs uppercase tracking-wider font-bold" htmlFor="verify-package-uid">
                      Package UID
                    </label>
                    <input
                      id="verify-package-uid"
                      value={packageDraft}
                      onChange={(event) => setPackageDraft(event.target.value)}
                      placeholder="0xb3…/updateseal"
                      className="w-full px-4 py-3 bg-stone-50 font-mono text-sm border-2 border-brand-charcoal focus:outline-none focus:bg-white shadow-[2px_2px_0px_#0B130E]"
                    />
                  </div>
                  <div className="lg:col-span-3 space-y-2">
                    <label className="block font-mono text-xs uppercase tracking-wider font-bold" htmlFor="verify-version">
                      Version
                    </label>
                    <input
                      id="verify-version"
                      value={versionDraft}
                      onChange={(event) => setVersionDraft(event.target.value)}
                      placeholder="0.1.0-v2-smoke"
                      className="w-full px-4 py-3 bg-stone-50 font-mono text-sm border-2 border-brand-charcoal focus:outline-none focus:bg-white shadow-[2px_2px_0px_#0B130E]"
                    />
                  </div>
                </>
              )}
              <div className="lg:col-span-3">
                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-brand-orange hover:bg-brand-charcoal text-white font-mono text-xs uppercase font-bold tracking-wider border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-charcoal"
                >
                  Verify release
                </button>
              </div>
            </form>
            {(formError || parsedSearch.error) && (
              <p className="mt-4 p-3 bg-red-100 border border-red-500 text-red-800 font-mono text-xs font-bold" role="alert">
                {formError ?? parsedSearch.error}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="w-full bg-brand-cream py-12 px-6 lg:px-12">
        <div className="max-w-[1360px] mx-auto space-y-6">
          {query.isFetching ? (
            <div className="bg-white border-2 border-brand-charcoal p-10 animate-pulse min-h-[180px]" data-testid="live-verify-loading" />
          ) : null}

          {query.error ? (
            <NetworkError error={query.error} onRetry={() => { void query.refetch(); }} />
          ) : null}

          {result ? <VerificationResultCard result={result} shareUrl={shareUrl} contractAddress={contractAddress} /> : null}

          {result && (result.outcome === 'verified' || result.outcome === 'pending') ? (
            <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] space-y-3">
              <h2 className="font-black uppercase">Evidence bytes</h2>
              <p className="text-sm">
                Evidence is not fetched automatically. Click to download the registered HTTPS GitHub raw URL and hash
                the exact bytes.
              </p>
              <button
                type="button"
                data-testid="verify-evidence-bytes"
                disabled={evidenceBusy}
                onClick={() => {
                  void runEvidence(result);
                }}
                className="bg-brand-forest text-white px-4 py-2 text-xs font-bold uppercase border-2 border-brand-charcoal shadow-[2px_2px_0px_#0B130E] disabled:opacity-60"
              >
                {evidenceBusy ? 'Verifying evidence…' : 'Verify Evidence Bytes'}
              </button>
              {evidenceOutcome ? (
                <p data-testid="evidence-bytes-result" className="font-mono text-xs font-bold">
                  {evidenceOutcome.message}
                  {'detail' in evidenceOutcome ? `: ${evidenceOutcome.detail}` : ''}
                </p>
              ) : null}
            </div>
          ) : null}

          {result && (result.outcome === 'verified' || result.outcome === 'pending') ? (
            <details className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E]">
              <summary className="font-black uppercase cursor-pointer">Machine-readable result</summary>
              <p className="text-xs mt-3">
                Assembled verification result from public contract reads. This JSON is not a single contract return
                object.
              </p>
              <pre className="mt-3 bg-stone-100 border border-brand-charcoal p-3 text-[11px] font-mono whitespace-pre-wrap break-all" data-testid="machine-json">
                {displayedMachineJson(result, evidenceOutcome)}
              </pre>
              <div className="mt-3">
                <CopyButton text={displayedMachineJson(result, evidenceOutcome)} label="Copy JSON" />
              </div>
            </details>
          ) : null}
        </div>
      </section>
    </div>
  );
};

function displayedMachineJson(
  result: Extract<VerifyReleaseResult, { machine: unknown }>,
  evidenceOutcome: EvidenceBytesOutcome | null,
): string {
  const machine =
    evidenceOutcome?.status === 'verified'
      ? { ...result.machine, evidence_bytes_verified: true }
      : evidenceOutcome?.status === 'mismatch'
        ? { ...result.machine, evidence_bytes_verified: false }
        : result.machine;
  return stringifyMachineReadableResult(machine);
}

const VerificationResultCard: React.FC<{
  result: VerifyReleaseResult;
  shareUrl: string;
  contractAddress: string;
}> = ({ result, shareUrl, contractAddress }) => {
  if (result.outcome === 'not_found') {
    return (
      <div className="bg-white border-2 border-brand-charcoal p-8 space-y-3" data-testid="live-verify-not-found" role="status">
        <h2 className="text-3xl font-black uppercase">RELEASE NOT FOUND</h2>
        <p className="text-sm">No UpdateSealRegistry candidate exists for this identifier on Studio-dev.</p>
        <p className="font-mono text-xs break-all">{result.requestedId}</p>
      </div>
    );
  }

  if (result.outcome === 'integrity') {
    return (
      <div className="bg-white border-2 border-brand-charcoal p-8 space-y-3" data-testid="live-verify-integrity" role="alert">
        <h2 className="text-3xl font-black uppercase">ON-CHAIN DATA INTEGRITY ERROR</h2>
        <p className="text-sm">{result.message}</p>
        {result.rawMalformedValue !== undefined ? (
          <pre className="bg-stone-100 border border-brand-charcoal p-3 text-[11px] font-mono whitespace-pre-wrap break-all">
            {result.rawMalformedValue}
          </pre>
        ) : null}
      </div>
    );
  }

  const { candidate, packageRecord, findingCodes } = result;
  const repoHref = safeExternalHref(packageRecord.repository_url);
  const evidenceHref = safeExternalHref(candidate.evidence_uri);
  const Icon = result.outcome === 'pending' ? Clock : result.status === 'APPROVED' ? CheckCircle2 : result.status === 'VIOLATION' ? ShieldAlert : AlertCircle;

  return (
    <div className="space-y-6" data-testid="live-verify-result">
      <section className={`relative border-2 border-brand-charcoal p-6 lg:p-10 shadow-[8px_8px_0px_#0B130E] ${headlineTone(result.headline)}`}>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-2 bg-white text-brand-charcoal font-mono text-xs px-3 py-1.5 font-bold uppercase border border-brand-charcoal">
            <Icon className="w-4 h-4" />
            {result.headline}
          </span>
          <span className="bg-brand-charcoal text-white font-mono text-xs px-3 py-1.5 font-bold uppercase border border-brand-charcoal">
            Status: {candidate.status}
          </span>
        </div>
        <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tight">{result.headline}</h2>
        <p className="text-base mt-4 max-w-3xl" data-testid="verify-summary">
          {result.outcome === 'pending'
            ? 'This candidate has no completed verdict. Evaluation is a separate on-chain write.'
            : candidate.decision_summary || '(empty)'}
        </p>
        {result.outcome === 'verified' ? (
          <p className="mt-3 font-mono text-xs font-bold" data-testid="decision-hash-verified">
            Decision hash verified
          </p>
        ) : (
          <p className="mt-3 font-mono text-xs font-bold" data-testid="no-final-decision-hash">
            No final decision hash yet
          </p>
        )}
      </section>

      {shareUrl ? (
        <div className="flex flex-wrap items-center gap-3">
          <CopyButton text={shareUrl} label="Copy verification link" />
          <span className="font-mono text-[11px] break-all">{shareUrl}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <PublicField label="Decision code" value={String(candidate.decision_code)} testId="verify-decision-code" />
        <PublicField label="Evaluation attempts" value={String(candidate.evaluation_attempts)} testId="verify-attempts" />
        <PublicField label="Status" value={candidate.status} testId="verify-status" />
        <PublicField label="Contract" value={contractAddress} />
      </div>

      <div>
        <h3 className="font-black uppercase mb-3">Finding codes</h3>
        {findingCodes.length > 0 ? (
          <ul className="flex flex-wrap gap-2" data-testid="verify-finding-codes">
            {findingCodes.map((code) => (
              <li
                key={code}
                data-testid="finding-code"
                className="bg-brand-pastelYellow border-2 border-brand-charcoal px-3 py-1.5 font-mono text-xs font-black uppercase"
              >
                {code}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs font-mono">(none)</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PublicField label="Package UID" value={packageRecord.package_uid} />
        <PublicField label="Package slug" value={packageRecord.package_slug} />
        <PublicField label="Publisher" value={packageRecord.publisher} />
        <PublicField label="Baseline commit SHA" value={packageRecord.baseline_commit_sha} />
        <PublicField label="Candidate ID" value={candidate.candidate_id} testId="verify-candidate-id" />
        <PublicField label="Version" value={candidate.version} />
        <PublicField label="Candidate commit SHA" value={candidate.candidate_commit_sha} />
        <PublicField label="Submitter" value={candidate.submitter} />
        <PublicField label="Charter hash" value={packageRecord.charter_hash} />
        <PublicField label="Evidence hash" value={candidate.evidence_hash} testId="verify-evidence-hash" />
        <PublicField label="Decision hash" value={candidate.decision_hash} testId="verify-decision-hash" />
      </div>

      <div className="bg-brand-forest text-white border-2 border-brand-charcoal p-6 shadow-[6px_6px_0px_#0B130E] space-y-4">
        <h3 className="font-mono text-xs text-brand-pastelYellow uppercase font-bold">Identifiers</h3>
        <HashField label="Decision hash" value={candidate.decision_hash} testId="verify-decision-hash-full" />
        <HashField label="Evidence hash" value={candidate.evidence_hash} />
        <div>
          <span className="text-stone-500 text-[10px] uppercase font-bold block mb-1">Repository</span>
          {repoHref ? (
            <a href={repoHref} target="_blank" rel="noopener noreferrer" className="text-brand-orange underline break-all font-bold">
              {packageRecord.repository_url}
              <ExternalLink className="inline w-3.5 h-3.5 ml-1" />
            </a>
          ) : (
            <span className="break-all">{packageRecord.repository_url}</span>
          )}
        </div>
        <div>
          <span className="text-stone-500 text-[10px] uppercase font-bold block mb-1">Evidence URI</span>
          {evidenceHref ? (
            <a href={evidenceHref} target="_blank" rel="noopener noreferrer" className="text-brand-orange underline break-all font-bold">
              {candidate.evidence_uri}
              <ExternalLink className="inline w-3.5 h-3.5 ml-1" />
            </a>
          ) : (
            <span className="break-all">{candidate.evidence_uri}</span>
          )}
        </div>
        <div className="flex flex-wrap gap-3 font-mono text-xs">
          <Link
            to={livePackagePath(packageRecord.publisher, packageRecord.package_slug)}
            className="bg-white text-brand-charcoal px-3 py-2 font-bold uppercase border border-brand-charcoal"
          >
            Package record
          </Link>
          <Link
            to={liveCandidateDecisionPath(packageRecord.publisher, packageRecord.package_slug, candidate.version)}
            className="bg-white text-brand-charcoal px-3 py-2 font-bold uppercase border border-brand-charcoal"
          >
            Decision report
          </Link>
        </div>
      </div>
    </div>
  );
};
