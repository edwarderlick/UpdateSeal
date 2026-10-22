import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 py-16 w-full text-center">
      <div className="relative mb-6">
        <span className="font-mono text-9xl font-black text-brand-charcoal select-none tracking-tighter opacity-15">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-brand-orange text-white font-mono text-base font-black px-4 py-1.5 uppercase border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] -rotate-3">
            UNREGISTERED ROUTE
          </span>
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-black uppercase text-brand-charcoal tracking-tight font-sans max-w-lg mb-3">
        Cryptographic Proof Not Found
      </h1>

      <p className="font-sans text-stone-700 text-sm max-w-md mb-8 leading-relaxed">
        The requested path does not exist on this node or is not a registered UpdateSeal route.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-xs">
        <Link
          to="/"
          className="px-6 py-3.5 bg-brand-forest hover:bg-brand-charcoal text-white font-bold uppercase border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] flex items-center gap-2 transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Return To Landing</span>
        </Link>
        <Link
          to="/registry"
          className="px-6 py-3.5 bg-brand-cream hover:bg-stone-200 text-brand-charcoal font-bold uppercase border-2 border-brand-charcoal shadow-[4px_4px_0px_#0B130E] flex items-center gap-2 transition-all"
        >
          <Compass className="w-4 h-4" />
          <span>Explore Registry</span>
        </Link>
      </div>
    </div>
  );
};
