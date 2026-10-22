import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, AlertCircle, GitCommit, FileCode } from 'lucide-react';
import { useRegistration } from '../features/registration/RegistrationContext';
import { RegisterStepper } from '../components/forms/RegisterStepper';

export const RegisterStep2Page: React.FC = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, validateStep2 } = useRegistration();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const { isValid, errors: validationErrors } = validateStep2();
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    navigate('/register/capabilities');
  };

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-150">
      <RegisterStepper currentStep={2} />

      {/* Editorial Title Banner */}
      <section className="w-full bg-brand-cream border-b-2 border-brand-charcoal py-8 px-6 lg:px-16">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
          <div className="max-w-3xl flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-brand-forest text-brand-pastelYellow font-mono text-[10px] font-bold px-2 py-1 uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                STAGE 02 / APPROVED BASELINE COMMIT
              </span>
              <span className="bg-brand-pastelYellow text-brand-charcoal font-mono text-[10px] font-bold px-2 py-1 uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] -rotate-1">
                40-HEX SHA ENFORCED
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tight leading-none text-brand-charcoal font-sans">
              ANCHOR THE KNOWN-GOOD CODE BASELINE
            </h1>
            <p className="text-sm text-stone-700 max-w-2xl leading-relaxed font-medium">
              Every future candidate release will be semantically diffed against this exact cryptographic Git commit. Future versions cannot introduce undeclared capabilities without failing validator consensus.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="w-full bg-[#EBE7DE] py-10 px-6 lg:px-16 flex-grow">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleContinue} className="bg-white border-2 border-brand-charcoal p-8 shadow-[6px_6px_0px_#0B130E] space-y-6">
            {/* Version */}
            <div>
              <label className="block font-mono text-xs font-black uppercase text-brand-charcoal mb-1">
                Baseline Release Version <span className="text-brand-orange">*</span>
              </label>
              <input
                type="text"
                value={formData.baselineVersion}
                onChange={(e) => updateFormData({ baselineVersion: e.target.value })}
                placeholder="v1.0.0"
                className="w-full p-3 font-mono text-xs border-2 border-brand-charcoal focus:ring-0 focus:border-brand-orange bg-brand-cream text-brand-charcoal font-bold"
              />
              {errors.baselineVersion && (
                <p className="text-error font-mono text-xs mt-1 flex items-center gap-1 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.baselineVersion}
                </p>
              )}
            </div>

            {/* Commit SHA */}
            <div>
              <label className="block font-mono text-xs font-black uppercase text-brand-charcoal mb-1 flex items-center justify-between">
                <span>Git commit SHA (40 or 64 hex) <span className="text-brand-orange">*</span></span>
                <span className="text-[10px] text-stone-500 font-normal">
                  {formData.baselineCommitSha.trim().length} chars
                </span>
              </label>
              <div className="relative">
                <GitCommit className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={formData.baselineCommitSha}
                  onChange={(e) => updateFormData({ baselineCommitSha: e.target.value })}
                  placeholder="4f89a29e81bfa0021c38e9184b2910cbe8822910"
                  className="w-full pl-9 pr-4 py-3 font-mono text-xs border-2 border-brand-charcoal focus:ring-0 focus:border-brand-orange bg-brand-cream text-brand-charcoal font-bold"
                />
              </div>
              {errors.baselineCommitSha && (
                <p className="text-error font-mono text-xs mt-1 flex items-center gap-1 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.baselineCommitSha}
                </p>
              )}
            </div>

            {/* Manifest Path */}
            <div>
              <label className="block font-mono text-xs font-black uppercase text-brand-charcoal mb-1">
                Root Manifest File Path <span className="text-brand-orange">*</span>
              </label>
              <div className="relative">
                <FileCode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={formData.manifestPath}
                  onChange={(e) => updateFormData({ manifestPath: e.target.value })}
                  placeholder="package.json"
                  className="w-full pl-9 pr-4 py-3 font-mono text-xs border-2 border-brand-charcoal focus:ring-0 focus:border-brand-orange bg-brand-cream text-brand-charcoal font-bold"
                />
              </div>
              {errors.manifestPath && (
                <p className="text-error font-mono text-xs mt-1 flex items-center gap-1 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.manifestPath}
                </p>
              )}
            </div>

            {/* License */}
            <div>
              <label className="block font-mono text-xs font-black uppercase text-brand-charcoal mb-1">
                Open-Source SPDX License Tag
              </label>
              <input
                type="text"
                value={formData.license}
                onChange={(e) => updateFormData({ license: e.target.value })}
                placeholder="Apache-2.0"
                className="w-full p-3 font-mono text-xs border-2 border-brand-charcoal focus:ring-0 focus:border-brand-orange bg-brand-cream text-brand-charcoal font-bold"
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t-2 border-brand-charcoal">
              <button
                type="button"
                onClick={() => navigate('/register/identity')}
                className="px-5 py-3 border border-brand-charcoal font-mono text-xs font-bold uppercase hover:bg-stone-100 cursor-pointer flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Identity
              </button>

              <button
                type="submit"
                className="px-7 py-3.5 bg-brand-orange text-white hover:bg-brand-charcoal font-mono text-xs uppercase font-black tracking-wider transition-colors border border-brand-charcoal shadow-[4px_4px_0px_#0B130E] flex items-center gap-2 cursor-pointer"
              >
                <span>Continue to Step 3 (Charter)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};
