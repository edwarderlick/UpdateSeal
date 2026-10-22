import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, GitCommit, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useCandidate } from '../features/candidate-release/CandidateContext';
import { CandidateStepper } from '../components/forms/CandidateStepper';

export const CandidateStep1Page: React.FC = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, validateStep1 } = useCandidate();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const { isValid, errors: valErrors } = validateStep1();
    if (!isValid) {
      setErrors(valErrors);
      return;
    }
    setErrors({});
    navigate('/packages/atlas-research-agent/releases/new/evidence');
  };

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-150">
      {/* Top Breadcrumbs */}
      <div className="bg-brand-cream border-b-2 border-brand-charcoal px-6 py-2.5 flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2">
          <Link to="/registry" className="text-stone-500 hover:text-brand-charcoal">
            Registry
          </Link>
          <span className="text-stone-400">/</span>
          <Link to="/packages/atlas-research-agent" className="bg-white px-2 py-0.5 border border-brand-charcoal font-bold text-brand-charcoal">
            atlas-research-agent
          </Link>
          <span className="text-stone-400">/</span>
          <span className="sticker-badge bg-brand-orange text-white">SUBMIT CANDIDATE RELEASE</span>
        </div>
        <span className="font-bold text-stone-700 bg-brand-pastelYellow px-2 py-0.5 border border-brand-charcoal">
          CHAIN: 61997
        </span>
      </div>

      <CandidateStepper currentStep={1} />

      {/* Active Baseline Context Strip */}
      <div className="w-full bg-brand-forest text-white px-6 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b-2 border-brand-charcoal font-mono">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="sticker-badge bg-brand-pastelYellow text-brand-charcoal">BASELINE CONTEXT</span>
          <span className="text-xs text-stone-300">ACTIVE CHARTER:</span>
          <span className="font-black text-sm text-brand-vibrantCyan bg-stone-900 px-2 py-0.5 border border-stone-700">
            v1.4.2
          </span>
          <span className="text-xs bg-black/60 px-2.5 py-1 text-brand-pastelYellow border border-stone-700 font-bold">
            SHA: 4f89a29e81bfa0021c38e9184b2910cbe8822910
          </span>
        </div>
        <div className="flex items-center gap-2 bg-brand-surfaceLight text-brand-charcoal px-3 py-1 border-2 border-brand-charcoal text-[11px] font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>SEAL RECORD (BASELINE DEMO)</span>
        </div>
      </div>

      {/* Main Form Canvas */}
      <section className="w-full bg-[#EBE7DE] py-10 px-6 lg:px-16 flex-grow">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleContinue} className="bg-white border-2 border-brand-charcoal p-8 shadow-[6px_6px_0px_#0B130E] space-y-6">
            <div className="bg-brand-pastelYellow p-4 border-2 border-brand-charcoal shadow-[3px_3px_0px_#0B130E]">
              <span className="sticker-badge bg-brand-orange text-white mb-1">SECTION 01 / PROVENANCE</span>
              <h1 className="font-black text-2xl uppercase tracking-tight text-brand-charcoal font-sans">
                CANDIDATE GIT PROVENANCE
              </h1>
              <p className="text-xs font-mono text-stone-800 mt-1">
                Specify the deterministic commit parameters that the GenLayer validator cluster will fetch to generate the semantic AST delta graph.
              </p>
            </div>

            {/* Candidate Version */}
            <div>
              <label className="block font-mono text-xs font-black uppercase text-brand-charcoal mb-1">
                Candidate SemVer Tag <span className="text-brand-orange">*</span>
              </label>
              <input
                type="text"
                value={formData.version}
                onChange={(e) => updateFormData({ version: e.target.value })}
                placeholder="v1.5.0"
                className="w-full p-3 font-mono text-xs border-2 border-brand-charcoal focus:ring-0 focus:border-brand-orange bg-brand-cream text-brand-charcoal font-bold"
              />
              {errors.version && (
                <p className="text-error font-mono text-xs mt-1 flex items-center gap-1 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.version}
                </p>
              )}
              <span className="text-[11px] font-mono text-stone-500 mt-1 block">
                Previous baseline: v1.4.2 → Candidate must follow semver specifications.
              </span>
            </div>

            {/* Candidate Git Branch */}
            <div>
              <label className="block font-mono text-xs font-black uppercase text-brand-charcoal mb-1">
                Canonical Git Branch Ref <span className="text-brand-orange">*</span>
              </label>
              <input
                type="text"
                value={formData.targetBranch}
                onChange={(e) => updateFormData({ targetBranch: e.target.value })}
                placeholder="refs/heads/release/v1.5"
                className="w-full p-3 font-mono text-xs border-2 border-brand-charcoal focus:ring-0 focus:border-brand-orange bg-brand-cream text-brand-charcoal font-bold"
              />
            </div>

            {/* Commit SHA */}
            <div>
              <label className="block font-mono text-xs font-black uppercase text-brand-charcoal mb-1 flex items-center justify-between">
                <span>Candidate Immutable Full Commit SHA (40-Hex) <span className="text-brand-orange">*</span></span>
                <span className="text-[10px] text-stone-500 font-normal">
                  {formData.commitSha.trim().length} / 40 chars
                </span>
              </label>
              <div className="relative">
                <GitCommit className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={formData.commitSha}
                  onChange={(e) => updateFormData({ commitSha: e.target.value })}
                  placeholder="d9b2e04f81c9a72b6c31048f9024cbb4901f4a9c"
                  className="w-full pl-9 pr-4 py-3 font-mono text-xs border-2 border-brand-charcoal focus:ring-0 focus:border-brand-orange bg-brand-cream text-brand-charcoal font-bold"
                />
              </div>
              {errors.commitSha && (
                <p className="text-error font-mono text-xs mt-1 flex items-center gap-1 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.commitSha}
                </p>
              )}
            </div>

            {/* Release Notes */}
            <div>
              <label className="block font-mono text-xs font-black uppercase text-brand-charcoal mb-1">
                Candidate Release Notes &amp; Intent Declaration
              </label>
              <textarea
                rows={3}
                value={formData.releaseNotes}
                onChange={(e) => updateFormData({ releaseNotes: e.target.value })}
                placeholder="Describe candidate changes and reason for revision..."
                className="w-full p-3 font-sans text-xs border-2 border-brand-charcoal focus:ring-0 focus:border-brand-orange bg-brand-cream text-brand-charcoal font-medium leading-relaxed"
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t-2 border-brand-charcoal font-mono">
              <Link
                to="/packages/atlas-research-agent"
                className="px-5 py-3 border border-brand-charcoal font-bold text-xs uppercase hover:bg-stone-100 cursor-pointer flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Cancel
              </Link>

              <button
                type="submit"
                className="px-7 py-3.5 bg-brand-orange text-white hover:bg-brand-charcoal font-bold text-xs uppercase tracking-wider transition-colors border border-brand-charcoal shadow-[4px_4px_0px_#0B130E] flex items-center gap-2 cursor-pointer"
              >
                <span>Continue to Step 2 (Evidence &amp; Diff)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};
