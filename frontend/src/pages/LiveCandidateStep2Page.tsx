import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { CandidateStepper } from '../components/forms/CandidateStepper';
import { DataModeBadge } from '../components/ui/DataModeBadge';
import { CopyButton } from '../components/ui/CopyButton';
import { useLiveCandidate } from '../features/candidate-release/LiveCandidateContext';
import { buildEvidenceV2Template } from '../lib/evidenceTemplate';
import {
  buildEvidencePreflightInputs,
  isAbortError,
  isEvidencePreflightCurrent,
  runEvidencePreflight,
  type EvidencePreflightFailure,
} from '../lib/evidencePreflight';
import {
  normalizeEvidenceHash,
  validateCandidateCommitSha,
  validateEvidenceMatchesPackage,
  parseRawGithubEvidence,
  validateVersion,
} from '../lib/candidateValidation';
import { liveCandidateWizardPath, livePackagePath } from '../lib/registrationValidation';

export const LiveCandidateStep2Page: React.FC = () => {
  const navigate = useNavigate();
  const {
    packageRecord,
    draft,
    updateDraft,
    evidenceStatus,
    evidencePassed,
    evidencePreflightGeneration,
    currentEvidenceInputs,
    beginEvidencePreflight,
    applyEvidencePreflightResult,
    abortInFlightEvidencePreflight,
    setEvidenceStatus,
  } = useLiveCandidate();
  const packagePath = livePackagePath(packageRecord.publisher, packageRecord.package_slug);
  const identityPath = liveCandidateWizardPath(packageRecord.publisher, packageRecord.package_slug, 'identity');
  const confirmPath = liveCandidateWizardPath(packageRecord.publisher, packageRecord.package_slug, 'confirm');
  const [templateDiff, setTemplateDiff] = useState('Describe the candidate changes.');
  const evidenceTemplate = useMemo(
    () =>
      buildEvidenceV2Template({
        packageUid: packageRecord.package_uid,
        version: draft.version.trim(),
        baselineCommitSha: packageRecord.baseline_commit_sha,
        diffSummary: templateDiff,
        changedFiles: [],
        declaredCapabilities: [],
        requestedDomains: [],
        evidenceItems: [],
        tests: [],
      }),
    [draft.version, packageRecord.baseline_commit_sha, packageRecord.package_uid, templateDiff],
  );

  const downloadTemplate = () => {
    if (!evidenceTemplate.ok) {
      return;
    }
    const blob = new Blob([evidenceTemplate.json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'evidence-v2.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    return () => {
      abortInFlightEvidencePreflight();
    };
  }, [abortInFlightEvidencePreflight]);

  const localFailure = (message: string, code: EvidencePreflightFailure['code']): EvidencePreflightFailure => {
    const inputs = buildEvidencePreflightInputs({
      evidenceUri: draft.evidenceUri,
      evidenceHash: draft.evidenceHash,
      packageUid: packageRecord.package_uid,
      version: draft.version,
      baselineCommitSha: packageRecord.baseline_commit_sha,
      candidateCommitSha: draft.candidateCommitSha,
    });
    return {
      ok: false,
      code,
      message,
      httpStatus: null,
      bodySize: null,
      computedSha256: null,
      expectedSha256: inputs.normalizedEvidenceHash,
      document: null,
      schemaOk: false,
      identityOk: false,
      inputs,
    };
  };

  const runPreflight = async () => {
    const version = draft.version.trim();
    const sha = draft.candidateCommitSha.trim();
    const uri = draft.evidenceUri.trim();
    const hashInput = draft.evidenceHash.trim();
    if (validateVersion(version) || validateCandidateCommitSha(sha)) {
      abortInFlightEvidencePreflight();
      setEvidenceStatus({
        kind: 'result',
        generation: evidencePreflightGeneration,
        result: localFailure(
          'Complete a valid version and candidate commit SHA on the identity step first.',
          'EVIDENCE_IDENTITY_MISMATCH',
        ),
      });
      return;
    }
    const parsed = parseRawGithubEvidence(uri);
    const matchError = parsed.ok ? validateEvidenceMatchesPackage(uri, packageRecord.repository_url, sha) : parsed.message;
    const hash = normalizeEvidenceHash(hashInput);
    if (!parsed.ok || matchError || !hash.ok) {
      abortInFlightEvidencePreflight();
      setEvidenceStatus({
        kind: 'result',
        generation: evidencePreflightGeneration,
        result: localFailure(matchError || (!hash.ok ? hash.message : 'Evidence URI or hash is invalid.'), 'EVIDENCE_SCHEMA_INVALID'),
      });
      return;
    }
    const { generation, signal } = beginEvidencePreflight();
    try {
      const result = await runEvidencePreflight(
        uri,
        hash.hash,
        {
          packageUid: packageRecord.package_uid,
          version,
          baselineCommitSha: packageRecord.baseline_commit_sha,
          candidateCommitSha: sha,
        },
        { signal },
      );
      if (signal.aborted) {
        return;
      }
      applyEvidencePreflightResult(generation, result);
    } catch (error) {
      if (isAbortError(error) || signal.aborted) {
        return;
      }
      applyEvidencePreflightResult(generation, localFailure('Evidence URI could not be fetched.', 'HTTP_ERROR'));
    }
  };

  const result =
    evidenceStatus.kind === 'result' && evidenceStatus.generation === evidencePreflightGeneration
      ? evidenceStatus.result
      : null;
  const fetching = evidenceStatus.kind === 'fetching' && evidenceStatus.generation === evidencePreflightGeneration;
  const canContinue = Boolean(
    evidencePassed &&
      evidenceStatus.kind === 'result' &&
      evidenceStatus.generation === evidencePreflightGeneration &&
      isEvidencePreflightCurrent(evidenceStatus.result, currentEvidenceInputs),
  );

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-150" data-testid="live-candidate-step-evidence">
      <div className="bg-brand-cream border-b-2 border-brand-charcoal px-6 py-2.5 flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/registry" className="text-stone-500 hover:text-brand-charcoal">
            Registry
          </Link>
          <span className="text-stone-400">/</span>
          <Link to={packagePath} className="bg-white px-2 py-0.5 border border-brand-charcoal font-bold">
            {packageRecord.package_slug}
          </Link>
          <span className="text-stone-400">/</span>
          <span className="sticker-badge bg-brand-orange text-white">EVIDENCE PREFLIGHT</span>
        </div>
        <DataModeBadge />
      </div>

      <CandidateStepper currentStep={2} mode="live" />

      <section className="w-full bg-brand-cream border-b-2 border-brand-charcoal py-8 px-6 lg:px-16">
        <div className="max-w-4xl mx-auto space-y-3">
          <h1 className="text-3xl font-black uppercase tracking-tight text-brand-charcoal font-sans">
            Evidence document preflight
          </h1>
          <p className="text-sm text-stone-700 max-w-2xl leading-relaxed font-medium">
            Generate Evidence Schema v2 first, add it to the candidate tree, then commit. The evidence JSON must not contain the candidate commit SHA. The raw GitHub URL commit segment binds the document to that SHA. UpdateSeal does not upload or modify the GitHub repository. This step checks the document. It is not validator consensus, AST analysis, or approval.
          </p>
        </div>
      </section>

      <section className="w-full bg-[#EBE7DE] py-10 px-6 lg:px-16 flex-grow">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] space-y-4" data-testid="live-evidence-v2-template">
            <div className="font-mono text-xs font-black uppercase">Evidence Schema v2 template</div>
            <ol className="list-decimal pl-5 space-y-1 text-[11px] font-mono text-stone-600">
              <li>Generate evidence-v2.json.</li>
              <li>Add it to the candidate code changes.</li>
              <li>Commit the final candidate tree.</li>
              <li>Obtain the resulting commit SHA.</li>
              <li>Use that SHA in the candidate form and raw GitHub URL.</li>
              <li>Hash the exact raw evidence bytes.</li>
              <li>Run evidence preflight.</li>
            </ol>
            <p className="text-[11px] font-mono text-stone-500">
              The document omits candidate_commit_sha on purpose. A Git commit hash depends on file bytes, so the SHA cannot live inside the evidence file. UpdateSeal does not upload, commit, or push this file.
            </p>
            <label className="block font-mono text-xs font-black uppercase text-brand-charcoal">Diff summary</label>
            <textarea
              value={templateDiff}
              onChange={(event) => setTemplateDiff(event.target.value)}
              rows={3}
              className="w-full p-3 font-mono text-xs border-2 border-brand-charcoal bg-brand-cream font-bold"
              data-testid="live-evidence-template-diff"
            />
            {!evidenceTemplate.ok && (
              <p className="text-error font-mono text-xs font-bold">{evidenceTemplate.message}</p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={!evidenceTemplate.ok}
                onClick={downloadTemplate}
                className="px-4 py-2 bg-brand-forest text-brand-pastelYellow font-mono text-xs font-bold uppercase border border-brand-charcoal disabled:opacity-60 flex items-center gap-2"
                data-testid="live-evidence-template-download"
              >
                <Download className="w-3.5 h-3.5" />
                Download evidence-v2.json
              </button>
              {evidenceTemplate.ok ? <CopyButton text={evidenceTemplate.json} label="Copy JSON" /> : null}
            </div>
          </div>

          <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] space-y-4">
            <label className="block font-mono text-xs font-black uppercase text-brand-charcoal">
              Evidence URI <span className="text-brand-orange">*</span>
            </label>
            <input
              type="text"
              value={draft.evidenceUri}
              onChange={(e) => updateDraft({ evidenceUri: e.target.value })}
              placeholder="https://raw.githubusercontent.com/{owner}/{repository}/{commit}/path/to/evidence.json"
              className="w-full p-3 font-mono text-xs border-2 border-brand-charcoal bg-brand-cream font-bold"
              data-testid="live-evidence-uri"
            />
            <p className="text-[11px] font-mono text-stone-500">
              Exact HTTPS raw.githubusercontent.com URL. Owner and repository must match the registered package. The commit path segment must match the candidate SHA. No query, fragment, credentials, port, percent-encoding, or traversal.
            </p>
            <label className="block font-mono text-xs font-black uppercase text-brand-charcoal">
              Expected SHA-256 <span className="text-brand-orange">*</span>
            </label>
            <input
              type="text"
              value={draft.evidenceHash}
              onChange={(e) => updateDraft({ evidenceHash: e.target.value })}
              placeholder="64-character hex of the exact raw bytes"
              className="w-full p-3 font-mono text-xs border-2 border-brand-charcoal bg-brand-cream font-bold"
              data-testid="live-evidence-hash"
            />
            <p className="text-[11px] font-mono text-stone-500">
              SHA-256 is computed over the fetched raw bytes. A reserialized JSON object is not hashed.
            </p>
            <button
              type="button"
              onClick={() => {
                void runPreflight();
              }}
              disabled={fetching}
              className="px-5 py-3 bg-brand-forest text-brand-pastelYellow font-mono text-xs font-bold uppercase border border-brand-charcoal shadow-[3px_3px_0px_#0B130E] disabled:opacity-60"
              data-testid="live-evidence-preflight-button"
            >
              {fetching ? 'Fetching evidence…' : 'Run evidence preflight'}
            </button>
          </div>

          <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] space-y-3 font-mono text-xs" data-testid="live-evidence-preflight-panel">
            <div className="font-black uppercase">Preflight result</div>
            {fetching && (
              <div className="flex items-center gap-2 text-stone-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                Fetching evidence as raw bytes…
              </div>
            )}
            {result && (
              <>
                <p>HTTP status: {result.ok ? result.httpStatus : result.httpStatus ?? 'n/a'}</p>
                <p>Body size: {result.ok ? result.bodySize : result.bodySize ?? 'n/a'} bytes</p>
                <p className="break-all">Expected SHA-256: {result.ok ? result.expectedSha256 : result.expectedSha256}</p>
                <p className="break-all">Computed SHA-256: {result.ok ? result.computedSha256 : result.computedSha256 ?? 'n/a'}</p>
                <p>Schema: {result.ok || ('schemaOk' in result && result.schemaOk) ? 'pass' : 'fail'}</p>
                <p>Identity: {result.ok ? 'pass' : result.identityOk ? 'pass' : 'fail'}</p>
                {!result.ok && (
                  <p className="text-error font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {result.message}
                  </p>
                )}
              </>
            )}
            {evidencePassed && (
              <div className="space-y-3 pt-3 border-t border-brand-charcoal">
                <p className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Evidence document checks passed. This is not an evaluation verdict.
                </p>
                <div>
                  <span className="uppercase text-[10px] text-stone-500 font-bold">Changed files</span>
                  <ul className="mt-1 space-y-1">
                    {evidencePassed.document.changedFiles.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="uppercase text-[10px] text-stone-500 font-bold">Declared capabilities</span>
                  <ul className="mt-1 space-y-1">
                    {evidencePassed.document.declaredCapabilities.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="uppercase text-[10px] text-stone-500 font-bold">Requested domains</span>
                  <ul className="mt-1 space-y-1">
                    {evidencePassed.document.requestedDomains.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="uppercase text-[10px] text-stone-500 font-bold">Evidence items</span>
                  <ul className="mt-1 space-y-1">
                    {evidencePassed.document.evidenceItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="uppercase text-[10px] text-stone-500 font-bold">Tests</span>
                  <ul className="mt-1 space-y-1">
                    {evidencePassed.document.tests.map((item) => (
                      <li key={`${item.name}-${item.status}`}>
                        {item.name}: {item.status}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {!result && !fetching && <p className="text-stone-500">No preflight has been run yet.</p>}
          </div>

          <div className="flex items-center justify-between pt-6 border-t-2 border-brand-charcoal font-mono">
            <button
              type="button"
              onClick={() => navigate(identityPath)}
              className="px-5 py-3 border border-brand-charcoal font-bold text-xs uppercase hover:bg-stone-100 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to identity
            </button>
            <button
              type="button"
              disabled={!canContinue}
              onClick={() => navigate(confirmPath)}
              className={`px-7 py-3.5 font-bold text-xs uppercase tracking-wider border border-brand-charcoal shadow-[4px_4px_0px_#0B130E] flex items-center gap-2 ${
                canContinue ? 'bg-brand-orange text-white cursor-pointer' : 'bg-stone-300 text-stone-500 cursor-not-allowed'
              }`}
              data-testid="live-evidence-continue"
            >
              <span>Continue to confirm</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
