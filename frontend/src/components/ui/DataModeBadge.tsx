import React from 'react';
import { getUpdateSealConfigResult } from '../../lib/updateSealConfig';

export const DataModeBadge: React.FC<{ className?: string; forceDemo?: boolean }> = ({
  className = '',
  forceDemo = false,
}) => {
  const result = getUpdateSealConfigResult();

  if (forceDemo) {
    return (
      <span
        data-testid="data-mode-badge"
        data-purpose="demo-data-indicator"
        className={`bg-brand-pastelYellow text-brand-charcoal px-2 py-0.5 font-mono text-[10px] font-bold uppercase border border-brand-charcoal shadow-[1px_1px_0px_#0B130E] ${className}`}
      >
        DEMO DATA
      </span>
    );
  }

  if (!result.ok) {
    return (
      <span
        data-testid="data-mode-badge"
        className={`bg-red-700 text-white px-2 py-0.5 font-mono text-[10px] font-bold uppercase border border-brand-charcoal shadow-[1px_1px_0px_#0B130E] ${className}`}
      >
        CONFIG ERROR
      </span>
    );
  }

  if (result.config.dataMode === 'live') {
    return (
      <span
        data-testid="data-mode-badge"
        className={`bg-emerald-500 text-brand-charcoal px-2 py-0.5 font-mono text-[10px] font-bold uppercase border border-brand-charcoal shadow-[1px_1px_0px_#0B130E] ${className}`}
      >
        LIVE • STUDIO-DEV
      </span>
    );
  }

  return (
    <span
      data-testid="data-mode-badge"
      data-purpose="demo-data-indicator"
      className={`bg-brand-pastelYellow text-brand-charcoal px-2 py-0.5 font-mono text-[10px] font-bold uppercase border border-brand-charcoal shadow-[1px_1px_0px_#0B130E] ${className}`}
    >
      DEMO DATA
    </span>
  );
};
