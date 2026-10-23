import React from 'react';
import { DESIGN_DEMO_BANNER_COPY, DESIGN_DEMO_BANNER_HEADING } from '../../lib/designDemo';

export const DesignDemoBanner: React.FC = () => {
  return (
    <aside
      data-testid="design-demo-banner"
      className="w-full bg-brand-pastelYellow text-brand-charcoal border-b-2 border-brand-charcoal px-4 lg:px-12 py-3"
    >
      <div className="max-w-[1440px] mx-auto flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            data-testid="design-demo-data-label"
            className="bg-brand-charcoal text-brand-pastelYellow px-2 py-0.5 font-mono text-[10px] font-black uppercase"
          >
            DEMO DATA
          </span>
          <p className="font-mono text-xs font-black uppercase tracking-wider">{DESIGN_DEMO_BANNER_HEADING}</p>
        </div>
        <p className="font-sans text-xs font-medium leading-relaxed text-stone-800">{DESIGN_DEMO_BANNER_COPY}</p>
      </div>
    </aside>
  );
};
