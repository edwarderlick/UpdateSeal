import React from 'react';
import { CheckCircle2, Lock, Radio } from 'lucide-react';
import { useRegistration } from '../../features/registration/RegistrationContext';

interface RegisterStepperProps {
  currentStep: 1 | 2 | 3 | 4;
}

export const RegisterStepper: React.FC<RegisterStepperProps> = ({ currentStep }) => {
  const { formData } = useRegistration();

  const steps = [
    {
      num: 1,
      title: 'Package Identity',
      subtitle: formData.packageId || 'Identity & Repo',
    },
    {
      num: 2,
      title: 'Approved Baseline',
      subtitle: formData.baselineVersion ? `${formData.baselineVersion} @ ${formData.baselineCommitSha.substring(0, 8)}...` : 'Commit & Manifest',
    },
    {
      num: 3,
      title: 'Capability Charter',
      subtitle: '6 Security Boundaries',
    },
    {
      num: 4,
      title: 'Review & Register',
      subtitle: 'Awaiting Charter Lock',
    },
  ];

  return (
    <section className="w-full bg-brand-cream border-b-2 border-brand-charcoal py-4 px-6 lg:px-16 select-none font-mono">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step) => {
          const isDone = currentStep > step.num;
          const isActive = currentStep === step.num;
          const isPending = currentStep < step.num;

          return (
            <div
              key={step.num}
              className={`p-3 flex items-center justify-between border-2 border-brand-charcoal transition-all ${
                isActive
                  ? 'bg-brand-orange text-white shadow-[3px_3px_0px_#0B130E]'
                  : isDone
                  ? 'bg-white text-brand-charcoal shadow-[2px_2px_0px_#0B130E]'
                  : 'bg-stone-100 text-stone-400 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`text-xs font-bold ${
                    isActive ? 'text-brand-pastelYellow font-black' : isDone ? 'text-stone-500' : 'text-stone-400'
                  }`}
                >
                  [{String(step.num).padStart(2, '0')}]
                </span>
                <div className="flex flex-col min-w-0">
                  <span
                    className={`text-xs font-bold uppercase truncate ${
                      isActive ? 'text-white font-black' : isDone ? 'text-brand-charcoal' : 'text-stone-400'
                    }`}
                  >
                    {step.title}
                  </span>
                  <span
                    className={`text-[11px] truncate ${
                      isActive
                        ? 'text-brand-pastelYellow font-bold'
                        : isDone
                        ? 'text-stone-500'
                        : 'text-stone-400'
                    }`}
                  >
                    {step.subtitle}
                  </span>
                </div>
              </div>

              {isDone && <CheckCircle2 className="w-5 h-5 text-brand-orange shrink-0" />}
              {isActive && <Radio className="w-5 h-5 text-brand-pastelYellow animate-pulse shrink-0" />}
              {isPending && <Lock className="w-4 h-4 text-stone-400 shrink-0" />}
            </div>
          );
        })}
      </div>
    </section>
  );
};
