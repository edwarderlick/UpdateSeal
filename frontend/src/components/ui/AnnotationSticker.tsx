import React from 'react';

interface AnnotationStickerProps {
  children: React.ReactNode;
  variant?: 'yellow' | 'orange' | 'pink' | 'cyan' | 'forest' | 'white';
  rotation?: 'left' | 'right' | 'none';
  className?: string;
}

export const AnnotationSticker: React.FC<AnnotationStickerProps> = ({
  children,
  variant = 'yellow',
  rotation = 'left',
  className = '',
}) => {
  const variantStyles = {
    yellow: 'bg-brand-pastelYellow text-brand-charcoal',
    orange: 'bg-brand-orange text-white',
    pink: 'bg-brand-pastelPink text-brand-charcoal',
    cyan: 'bg-brand-vibrantCyan text-brand-charcoal',
    forest: 'bg-brand-forest text-brand-pastelYellow',
    white: 'bg-white text-brand-charcoal',
  };

  const rotationStyles = {
    left: '-rotate-1',
    right: 'rotate-1',
    none: 'rotate-0',
  };

  return (
    <span
      className={`inline-block border border-brand-charcoal px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider shadow-[2px_2px_0px_#0B130E] transform ${variantStyles[variant]} ${rotationStyles[rotation]} ${className}`}
    >
      {children}
    </span>
  );
};
