import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Shield, AlertCircle } from 'lucide-react';
import { useRegistration } from '../features/registration/RegistrationContext';
import { RegisterStepper } from '../components/forms/RegisterStepper';

export const RegisterStep1Page: React.FC = () => {
  const navigate = useNavigate();
  const { formData, updateFormData, validateStep1 } = useRegistration();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    const { isValid, errors: validationErrors } = validateStep1();
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    navigate('/register/baseline');
  };

  return (
    <div className="w-full flex flex-col animate-in fade-in duration-150">
      <RegisterStepper currentStep={1} />

      {/* Editorial Title Banner */}
      <section className="w-full bg-brand-cream border-b-2 border-brand-charcoal py-8 px-6 lg:px-16">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row items-start lg:items-end justify-between gap-6">
          <div className="max-w-3xl flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-brand-forest text-brand-pastelYellow font-mono text-[10px] font-bold px-2 py-1 uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                STAGE 01 / IDENTITY REGISTRATION
              </span>
              <span className="bg-brand-pastelYellow text-brand-charcoal font-mono text-[10px] font-bold px-2 py-1 uppercase border border-brand-charcoal shadow-[2px_2px_0px_#0B130E] -rotate-1">
                EIP-712 COMPLIANT
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tight leading-none text-brand-charcoal font-sans">
              REGISTER PACKAGE IDENTITY &amp; SOURCE REPO
            </h1>
            <p className="text-sm text-stone-700 max-w-2xl leading-relaxed font-medium">
              Establish the cryptographic identity of your autonomous agent. UpdateSeal anchors your GitHub repository and publisher wallet into the immutable GenLayer Studio Next registry.
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="w-full bg-[#EBE7DE] py-10 px-6 lg:px-16 flex-grow">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleContinue} className="bg-white border-2 border-brand-charcoal p-8 shadow-[6px_6px_0px_#0B130E] space-y-6">
            {/* Package ID */}
            <div>
              <label className="block font-mono text-xs font-black uppercase text-brand-charcoal mb-1">
                Package Namespace ID <span className="text-brand-orange">*</span>
              </label>
              <input
                type="text"
                value={formData.packageId}
                onChange={(e) => updateFormData({ packageId: e.target.value })}
                placeholder="sentinel-code-auditor"
                className="w-full p-3 font-mono text-xs border-2 border-brand-charcoal focus:ring-0 focus:border-brand-orange bg-brand-cream text-brand-charcoal font-bold"
              />
              {errors.packageId && (
                <p className="text-error font-mono text-xs mt-1 flex items-center gap-1 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.packageId}
                </p>
              )}
              <span className="text-[11px] font-mono text-stone-500 mt-1 block">
                3–80 lowercase letters, digits, '.', '-', '_'. No '/', '@', or whitespace.
              </span>
            </div>

            {/* Display Name */}
            <div>
              <label className="block font-mono text-xs font-black uppercase text-brand-charcoal mb-1">
                Display Name <span className="text-brand-orange">*</span>
              </label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => updateFormData({ displayName: e.target.value })}
                placeholder="Sentinel Code Auditor"
                className="w-full p-3 font-mono text-xs border-2 border-brand-charcoal focus:ring-0 focus:border-brand-orange bg-brand-cream text-brand-charcoal font-bold"
              />
              {errors.displayName && (
                <p className="text-error font-mono text-xs mt-1 flex items-center gap-1 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.displayName}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block font-mono text-xs font-black uppercase text-brand-charcoal mb-1">
                Agent Purpose &amp; Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Autonomous static analysis daemon evaluating smart contracts against security invariants..."
                className="w-full p-3 font-sans text-xs border-2 border-brand-charcoal focus:ring-0 focus:border-brand-orange bg-brand-cream text-brand-charcoal font-medium leading-relaxed"
              />
            </div>

            {/* Repository URL */}
            <div>
              <label className="block font-mono text-xs font-black uppercase text-brand-charcoal mb-1">
                Public GitHub Repository URL <span className="text-brand-orange">*</span>
              </label>
              <input
                type="text"
                value={formData.repositoryUrl}
                onChange={(e) => updateFormData({ repositoryUrl: e.target.value })}
                placeholder="https://github.com/sentinel-sec/code-auditor"
                className="w-full p-3 font-mono text-xs border-2 border-brand-charcoal focus:ring-0 focus:border-brand-orange bg-brand-cream text-brand-charcoal font-bold"
              />
              {errors.repositoryUrl && (
                <p className="text-error font-mono text-xs mt-1 flex items-center gap-1 font-bold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {errors.repositoryUrl}
                </p>
              )}
            </div>

            {/* Owner Wallet */}
            <div>
              <label className="block font-mono text-xs font-black uppercase text-brand-charcoal mb-1">
                Publisher / Owner Wallet
              </label>
              <input
                type="text"
                value={formData.ownerWallet}
                onChange={(e) => updateFormData({ ownerWallet: e.target.value })}
                className="w-full p-3 font-mono text-xs border border-brand-charcoal bg-stone-100 text-stone-700 font-bold"
              />
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t-2 border-brand-charcoal">
              <button
                type="button"
                onClick={() => navigate('/registry')}
                className="px-5 py-3 border border-brand-charcoal font-mono text-xs font-bold uppercase hover:bg-stone-100 cursor-pointer flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Cancel
              </button>

              <button
                type="submit"
                className="px-7 py-3.5 bg-brand-orange text-white hover:bg-brand-charcoal font-mono text-xs uppercase font-black tracking-wider transition-colors border border-brand-charcoal shadow-[4px_4px_0px_#0B130E] flex items-center gap-2 cursor-pointer"
              >
                <span>Continue to Step 2</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};
