import React from 'react';

interface CandidateStepperProps {
  currentStep: 1 | 2 | 3;
  mode?: 'demo' | 'live';
}

export const CandidateStepper: React.FC<CandidateStepperProps> = ({ currentStep, mode = 'demo' }) => {
  const steps =
    mode === 'live'
      ? [
          {
            num: 1,
            title: '01 // RELEASE IDENTITY',
            subtitle: 'Version, candidate commit SHA, and frozen package identity.',
          },
          {
            num: 2,
            title: '02 // EVIDENCE PREFLIGHT',
            subtitle: 'Raw GitHub evidence URI, SHA-256, and JSON schema checks.',
          },
          {
            num: 3,
            title: '03 // REVIEW & SUBMIT',
            subtitle: 'Submit candidate metadata. Status will be PENDING. Evaluation is a later transaction.',
          },
        ]
      : [
          {
            num: 1,
            title: '01 // RELEASE IDENTITY',
            subtitle: 'Immutable Git coordinates, SemVer & author provenance.',
          },
          {
            num: 2,
            title: '02 // EVIDENCE BOUNDARY & DIFF',
            subtitle: 'AST delta graph, network egress whitelist & tool manifest.',
          },
          {
            num: 3,
            title: '03 // REVIEW & DISPATCH',
            subtitle: 'GenLayer multi-validator consensus simulation & sealing.',
          },
        ];

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 border-b-2 border-brand-charcoal bg-brand-charcoal gap-0.5 select-none font-mono">
      {steps.map((step) => {
        const isDone = currentStep > step.num;
        const isActive = currentStep === step.num;

        return (
          <div
            key={step.num}
            className={`p-5 flex flex-col justify-between border-r-0 md:border-r-2 border-brand-charcoal transition-colors ${
              isActive
                ? 'bg-[#F4E77E] text-brand-charcoal'
                : isDone
                ? 'bg-white text-brand-charcoal'
                : 'bg-[#FAF8F4] text-stone-600'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className={`sticker-badge border border-brand-charcoal ${
                  isActive
                    ? 'bg-brand-orange text-white'
                    : isDone
                    ? 'bg-brand-forest text-brand-pastelYellow'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {isActive ? `ACTIVE STAGE 0${step.num}` : isDone ? `COMPLETED` : `STAGE 0${step.num}`}
              </span>
              <span className="text-xs font-bold bg-white px-2 py-0.5 border border-brand-charcoal shadow-[2px_2px_0px_#0B130E]">
                0{step.num} / 03
              </span>
            </div>

            <div>
              <h2 className="font-black text-sm uppercase tracking-tight text-brand-charcoal mb-1 font-sans flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 inline-block border border-brand-charcoal ${
                    isActive ? 'bg-brand-orange' : isDone ? 'bg-emerald-500' : 'bg-stone-300'
                  }`}
                ></span>
                {step.title}
              </h2>
              <p className="text-xs text-stone-700 leading-snug">{step.subtitle}</p>
            </div>

            <div className="w-full bg-stone-200 h-2 mt-4 border border-brand-charcoal">
              <div
                className={`h-full transition-all ${
                  isActive ? 'w-full bg-brand-orange' : isDone ? 'w-full bg-brand-forest' : 'w-0'
                }`}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
