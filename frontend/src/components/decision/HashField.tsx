import React from 'react';
import { CopyButton } from '../ui/CopyButton';

interface HashFieldProps {
  label: string;
  value: string;
  testId?: string;
}

export const HashField: React.FC<HashFieldProps> = ({ label, value, testId }) => {
  return (
    <div>
      <span className="text-stone-500 text-[10px] uppercase font-bold block mb-1">{label}</span>
      <div className="flex items-start justify-between gap-2 bg-stone-900 p-2.5 border border-stone-800">
        <span className="text-brand-pastelYellow break-all font-mono text-xs" data-testid={testId}>
          {value || '(empty)'}
        </span>
        {value ? (
          <CopyButton
            text={value}
            label="Copy"
            className="shrink-0 bg-white text-brand-charcoal focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange"
          />
        ) : null}
      </div>
    </div>
  );
};
