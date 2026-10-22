import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Layers, FileBadge } from 'lucide-react';
import { useRegistration } from '../features/registration/RegistrationContext';
import { DataModeBadge } from '../components/ui/DataModeBadge';
import { getUpdateSealConfigResult } from '../lib/updateSealConfig';
import { livePackagePath } from '../lib/registrationValidation';

export const RegisterSuccessPage: React.FC = () => {
  const { formData, liveReceipt } = useRegistration();
  const configResult = getUpdateSealConfigResult();
  const isLive = configResult.ok && configResult.config.dataMode === 'live' && liveReceipt;

  return (
    <div className="w-full flex flex-col items-center justify-center py-16 px-6 lg:px-16 animate-in fade-in duration-150 flex-grow bg-[#EBE7DE]">
      <div className="max-w-2xl w-full bg-white border-2 border-brand-charcoal p-8 lg:p-12 shadow-[8px_8px_0px_#0B130E] text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-800 border-2 border-emerald-600 flex items-center justify-center mx-auto shadow-[4px_4px_0px_#0B130E]">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center">
            <DataModeBadge />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-brand-charcoal font-sans">
            {isLive ? 'Registration Finalized' : 'Demo Registration Complete'}
          </h1>
          <p className="text-sm text-stone-700 max-w-lg mx-auto font-medium leading-relaxed">
            {isLive
              ? 'Studio-dev consensus accepted this package. The charter hash below comes from the on-chain record.'
              : 'Your package charter has been verified in the demo workspace. DEMO DATA only — no transaction was submitted.'}
          </p>
        </div>

        {isLive && liveReceipt ? (
          <div className="bg-stone-50 border-2 border-brand-charcoal p-5 text-left font-mono text-xs space-y-2 shadow-[2px_2px_0px_#0B130E]" data-testid="live-registration-receipt">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <span className="text-stone-500 uppercase font-bold">Canonical Status:</span>
              <span className="text-emerald-700 font-bold uppercase">FINALIZED AND ACCEPTED</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-stone-500 uppercase shrink-0">Package UID:</span>
              <span className="font-bold text-brand-charcoal break-all text-right">{liveReceipt.packageUid}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-stone-500 uppercase shrink-0">Publisher:</span>
              <span className="font-bold text-brand-charcoal break-all text-right">{liveReceipt.publisher}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-stone-500 uppercase shrink-0">Repository:</span>
              <span className="font-bold text-brand-charcoal break-all text-right">{liveReceipt.repositoryUrl}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-stone-500 uppercase shrink-0">Baseline SHA:</span>
              <span className="font-bold text-brand-charcoal break-all text-right">{liveReceipt.baselineCommitSha}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-stone-500 uppercase shrink-0">Charter hash:</span>
              <span className="font-bold text-brand-charcoal break-all text-right">{liveReceipt.charterHash}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span className="text-stone-500 uppercase shrink-0">Transaction:</span>
              <span className="font-bold text-brand-charcoal break-all text-right">{liveReceipt.transactionHash}</span>
            </div>
          </div>
        ) : (
          <div className="bg-stone-50 border-2 border-brand-charcoal p-5 text-left font-mono text-xs space-y-2 shadow-[2px_2px_0px_#0B130E]">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <span className="text-stone-500 uppercase font-bold">Canonical Status:</span>
              <span className="text-emerald-700 font-bold uppercase">DEMO REGISTRATION COMPLETE</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500 uppercase">Package ID:</span>
              <span className="font-bold text-brand-charcoal">{formData.packageId || 'sentinel-code-auditor'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500 uppercase">Baseline Version:</span>
              <span className="font-bold text-brand-charcoal">{formData.baselineVersion || 'v1.0.0'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500 uppercase">Commit Ref:</span>
              <span className="font-bold text-stone-800 truncate max-w-[200px]">
                {formData.baselineCommitSha.substring(0, 16)}...
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500 uppercase">Transaction Status:</span>
              <span className="text-brand-orange font-bold truncate max-w-[260px]">
                DEMO DATA — no transaction submitted
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 font-mono text-xs">
          <Link
            to="/registry"
            className="w-full sm:w-auto px-6 py-3.5 bg-brand-orange text-white hover:bg-brand-charcoal uppercase font-black border border-brand-charcoal shadow-[3px_3px_0px_#0B130E] flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Layers className="w-4 h-4" />
            <span>Explore Registry</span>
          </Link>
          {isLive && liveReceipt ? (
            <Link
              to={livePackagePath(liveReceipt.publisher, liveReceipt.packageSlug)}
              className="w-full sm:w-auto px-6 py-3.5 bg-white text-brand-charcoal hover:bg-stone-100 uppercase font-bold border border-brand-charcoal shadow-[3px_3px_0px_#0B130E] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              data-testid="open-live-package"
            >
              <FileBadge className="w-4 h-4" />
              <span>Open live package</span>
            </Link>
          ) : (
            <Link
              to="/packages/atlas-research-agent"
              className="w-full sm:w-auto px-6 py-3.5 bg-white text-brand-charcoal hover:bg-stone-100 uppercase font-bold border border-brand-charcoal shadow-[3px_3px_0px_#0B130E] flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <FileBadge className="w-4 h-4" />
              <span>View Example Dossier</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
