import React from 'react';
import { ReleaseStatus, DecisionCode } from '../../types';

interface StatusBadgeProps {
  status?: ReleaseStatus;
  decisionCode?: DecisionCode;
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  decisionCode,
  label,
  className = '',
}) => {
  if (decisionCode) {
    const codeMap: Record<DecisionCode, { text: string; bg: string }> = {
      '0x01': { text: '0x01 APPROVED', bg: 'bg-emerald-100 text-emerald-900 border-emerald-600' },
      '0x02': { text: '0x02 REVIEW REQ', bg: 'bg-brand-pastelYellow text-brand-charcoal border-brand-charcoal' },
      '0x03': { text: '0x03 VIOLATION', bg: 'bg-error text-white border-brand-charcoal' },
      '0x04': { text: '0x04 UNAVAILABLE', bg: 'bg-stone-300 text-brand-charcoal border-stone-600' },
    };
    const c = codeMap[decisionCode];
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider border shadow-[2px_2px_0px_#0B130E] ${c.bg} ${className}`}
      >
        {label || c.text}
      </span>
    );
  }

  const statusMap: Record<ReleaseStatus, { text: string; bg: string }> = {
    SEALED: { text: 'APPROVED (DEMO)', bg: 'bg-brand-forest text-brand-pastelYellow border-brand-charcoal' },
    EVALUATING: { text: 'CONSENSUS PENDING', bg: 'bg-brand-orange text-white border-brand-charcoal' },
    REJECTED: { text: 'REJECTED (VIOLATION)', bg: 'bg-error text-white border-brand-charcoal' },
    REVIEW_REQUIRED: { text: 'REVIEW REQUIRED', bg: 'bg-brand-pastelYellow text-brand-charcoal border-brand-charcoal' },
    STAGED_PENDING_TX: { text: 'STAGED PENDING TX', bg: 'bg-brand-vibrantCyan text-brand-charcoal border-brand-charcoal' },
  };

  const s = status ? statusMap[status] : { text: label || 'UNKNOWN', bg: 'bg-stone-200 text-brand-charcoal border-brand-charcoal' };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider border shadow-[2px_2px_0px_#0B130E] ${s.bg} ${className}`}
    >
      {label || s.text}
    </span>
  );
};
