import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft, ArrowRight, GitCommit } from 'lucide-react';
import { CandidateStepper } from '../components/forms/CandidateStepper';
import { DataModeBadge } from '../components/ui/DataModeBadge';
import { CopyButton } from '../components/ui/CopyButton';
import { useLiveCandidate } from '../features/candidate-release/LiveCandidateContext';
import { isSemverRecommendation, validateCandidateCommitSha, validateVersion } from '../lib/candidateValidation';
import { liveCandidateWizardPath, livePackagePath } from '../lib/registrationValidation';

export const LiveCandidateStep1Page: React.FC = () => {
  const navigate = useNavigate();
  const { packageRecord, draft, updateDraft } = useLiveCandidate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const packagePath = livePackagePath(packageRecord.publisher, packageRecord.package_slug);
  const evidencePath = liveCandidateWizardPath(packageRecord.publisher, packageRecord.package_slug, 'evidence');

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const version = draft.version.trim();
    const sha = draft.candidateCommitSha.trim();
    const next: Record<string, string> = {};
    const versionError = validateVersion(version);
    if (!version) {
      next.version = 'Version is required.';
    } else if (versionError) {
      next.version = versionError;
    }
    const shaError = validateCandidateCommitSha(sha);
    if (!sha) {
      next.candidateCommitSha = 'Candidate commit SHA is required.';
    } else if (shaError) {
      next.candidateCommitSha = shaError;
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    updateDraft({ version, candidateCommitSha: sha });
    setErrors({});
    navigate(evidencePath);
  };

  const versionTrimmed = draft.version.trim();
  const showSemverHint = versionTrimmed.length > 0 && !validateVersion(versionTrimmed) && !isSemverRecommendation(versionTrimmed);

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-150" data-testid="live-candidate-step-identity">
      <div className="bg-brand-cream border-b-2 border-brand-charcoal px-6 py-2.5 flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/registry" className="text-stone-500 hover:text-brand-charcoal">
            Registry
          </Link>
          <span className="text-stone-400">/</span>
          <Link to={packagePath} className="bg-white px-2 py-0.5 border border-brand-charcoal font-bold text-brand-charcoal">
            {packageRecord.package_slug}
          </Link>
          <span className="text-stone-400">/</span>
          <span className="sticker-badge bg-brand-orange text-white">SUBMIT CANDIDATE</span>
        </div>
        <DataModeBadge />
      </div>

      <CandidateStepper currentStep={1} mode="live" />

      <div className="w-full bg-brand-forest text-white px-6 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b-2 border-brand-charcoal font-mono">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="sticker-badge bg-brand-pastelYellow text-brand-charcoal">FROZEN PACKAGE</span>
          <span className="text-xs break-all">{packageRecord.package_uid}</span>
        </div>
        <span className="text-[11px] bg-black/60 px-2.5 py-1 text-brand-pastelYellow border border-stone-700 font-bold">
          BASELINE SHA: {packageRecord.baseline_commit_sha}
        </span>
      </div>

      <section className="w-full bg-[#EBE7DE] py-10 px-6 lg:px-16 flex-grow">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleContinue} className="bg-white border-2 border-brand-charcoal p-8 shadow-[6px_6px_0px_#0B130E] space-y-6">
            <div className="bg-brand-pastelYellow p-4 border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E]">
              <span className="sticker-badge bg-brand-orange text-white mb-1">SECTION 01 / IDENTITY</span>
              <h1 className="font-black text-2xl uppercase tracking-tight text-brand-charcoal font-sans">
                Candidate identity
              </h1>
              <p className="text-xs font-mono text-stone-800 mt-1">
                Version and commit SHA are stored on-chain. Only the registered publisher wallet may submit. GitHub ownership is not verified.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              <div>
                <span className="text-[10px] uppercase text-stone-500 font-bold">Package UID</span>
                <div className="mt-1 break-all font-bold">{packageRecord.package_uid}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase text-stone-500 font-bold">Publisher</span>
                <div className="mt-1 break-all font-bold flex items-center gap-1">
                  {packageRecord.publisher}
                  <CopyButton text={packageRecord.publisher} />
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase text-stone-500 font-bold">Repository</span>
                <div className="mt-1 break-all font-bold">{packageRecord.repository_url}</div>
              </div>
              <div>
                <span className="text-[10px] uppercase text-stone-500 font-bold">Charter hash</span>
                <div className="mt-1 break-all font-bold">{packageRecord.charter_hash}</div>
              </div>
            </div>

            <div>
              <label className="block font-mono text-xs font-black uppercase text-brand-charcoal mb-1">
                Version <span className="text-brand-orange">*</span>
              </label>
              <input
                type="text"
                value={draft.version}
                onChange={(e) => updateDraft({ version: e.target.value })}
                placeholder="1.0.1"
                className="w-full p-3 font-mono text-xs border-2 border-brand-charcoal focus:ring-0 focus:border-brand-orange bg-brand-cream text-brand-charcoal font-bold"
                data-testid="live-candidate-version"
              />
              {errors.version && (
                <p className="text-error font-mono text-xs mt-1 flex items-center gap-1 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.version}
                </p>
              )}
              <span className="text-[11px] font-mono text-stone-500 mt-1 block">
                Contract rule: 1–40 characters from a-z A-Z 0-9 . + -. SemVer is recommended but not required.
              </span>
              {showSemverHint && (
                <span className="text-[11px] font-mono text-stone-600 mt-1 block">
                  SemVer is a recommendation only. This version is allowed by the contract.
                </span>
              )}
            </div>

            <div>
              <label className="block font-mono text-xs font-black uppercase text-brand-charcoal mb-1 flex items-center justify-between">
                <span>
                  Candidate commit SHA <span className="text-brand-orange">*</span>
                </span>
                <span className="text-[10px] text-stone-500 font-normal">
                  {draft.candidateCommitSha.trim().length} chars
                </span>
              </label>
              <div className="relative">
                <GitCommit className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={draft.candidateCommitSha}
                  onChange={(e) => updateDraft({ candidateCommitSha: e.target.value })}
                  placeholder="40- or 64-character hex"
                  className="w-full pl-9 pr-4 py-3 font-mono text-xs border-2 border-brand-charcoal focus:ring-0 focus:border-brand-orange bg-brand-cream text-brand-charcoal font-bold"
                  data-testid="live-candidate-sha"
                />
              </div>
              {errors.candidateCommitSha && (
                <p className="text-error font-mono text-xs mt-1 flex items-center gap-1 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.candidateCommitSha}
                </p>
              )}
              <span className="text-[11px] font-mono text-stone-500 mt-1 block">
                Exactly 40 or 64 hexadecimal characters. Case is preserved as entered.
              </span>
            </div>

            <div className="flex items-center justify-between pt-6 border-t-2 border-brand-charcoal font-mono">
              <Link
                to={packagePath}
                className="px-5 py-3 border border-brand-charcoal font-bold text-xs uppercase hover:bg-stone-100 cursor-pointer flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Cancel
              </Link>
              <button
                type="submit"
                className="px-7 py-3.5 bg-brand-orange text-white hover:bg-brand-charcoal font-bold text-xs uppercase tracking-wider transition-colors border border-brand-charcoal shadow-[4px_4px_0px_#0B130E] flex items-center gap-2 cursor-pointer"
              >
                <span>Continue to evidence</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};
