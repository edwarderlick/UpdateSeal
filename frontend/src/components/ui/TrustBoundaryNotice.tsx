import React from 'react';
import { TRUST_BOUNDARY_NOTICE } from '../../lib/trustBoundary';

export const TrustBoundaryNotice: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <aside
      data-testid="trust-boundary-notice"
      className={`bg-white border-2 border-brand-charcoal px-4 py-3 shadow-[2px_2px_0px_#0B130E] ${className}`}
    >
      <p className="font-mono text-[10px] font-black uppercase tracking-wider text-brand-orange mb-1">
        Trust boundary
      </p>
      <p className="font-sans text-xs font-medium leading-relaxed text-stone-800">{TRUST_BOUNDARY_NOTICE}</p>
    </aside>
  );
};
