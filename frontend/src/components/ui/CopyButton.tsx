import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

export const CopyButton: React.FC<CopyButtonProps> = ({ text, label, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={label || 'Copy to clipboard'}
      title={label || 'Copy to clipboard'}
      className={`inline-flex items-center gap-1.5 px-2 py-1 font-mono text-xs font-bold transition-colors border border-brand-charcoal hover:bg-stone-200 active:bg-brand-pastelYellow cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          {label && <span>Copied!</span>}
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 text-stone-700" />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
};
