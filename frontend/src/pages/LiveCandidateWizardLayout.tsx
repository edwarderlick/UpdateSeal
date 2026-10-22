import React from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import { DataModeBadge } from '../components/ui/DataModeBadge';
import { LiveCandidateProvider } from '../features/candidate-release/LiveCandidateContext';
import { useOnChainPackageByPublisherSlug } from '../features/registry/registryQueries';
import { getUpdateSealConfigResult, isLiveReadsEnabled } from '../lib/updateSealConfig';
import { logUpdateSealError, toUpdateSealError } from '../lib/updateSealErrors';

export const LiveCandidateWizardLayout: React.FC = () => {
  const { publisher = '', packageSlug = '' } = useParams();
  const decodedPublisher = decodeURIComponent(publisher);
  const decodedSlug = decodeURIComponent(packageSlug);
  const configResult = getUpdateSealConfigResult();
  const liveEnabled = isLiveReadsEnabled(configResult);
  const query = useOnChainPackageByPublisherSlug(decodedPublisher, decodedSlug);

  if (!configResult.ok) {
    return (
      <div className="bg-brand-cream px-6 py-16" data-testid="live-candidate-config-error">
        <div className="max-w-xl mx-auto bg-white border-2 border-brand-charcoal p-8 shadow-[4px_4px_0px_#0B130E] space-y-3">
          <DataModeBadge />
          <h1 className="text-2xl font-black uppercase">Configuration Error</h1>
          <p className="text-xs font-mono text-stone-600">{configResult.error.userMessage}</p>
        </div>
      </div>
    );
  }

  if (!liveEnabled) {
    return (
      <div className="bg-brand-cream px-6 py-16" data-testid="live-candidate-demo-unavailable">
        <div className="max-w-xl mx-auto bg-white border-2 border-brand-charcoal p-8 shadow-[4px_4px_0px_#0B130E] space-y-4">
          <DataModeBadge />
          <h1 className="text-2xl font-black uppercase">Live Route Unavailable</h1>
          <p className="text-xs font-mono text-stone-600">
            Live candidate routes are unavailable in demo mode. Use the Atlas demo wizard for simulated submissions.
          </p>
          <Link
            to="/packages/atlas-research-agent/releases/new/identity"
            className="inline-block bg-brand-orange text-white px-4 py-2 text-xs font-bold uppercase border border-brand-charcoal"
          >
            Open Atlas demo wizard
          </Link>
        </div>
      </div>
    );
  }

  if (query.isLoading) {
    return (
      <div className="bg-brand-cream px-6 py-16" data-testid="live-candidate-loading">
        <div className="max-w-[1400px] mx-auto bg-white border-2 border-brand-charcoal p-10 animate-pulse min-h-[320px] shadow-[4px_4px_0px_#0B130E]" />
      </div>
    );
  }

  const error = query.error ? toUpdateSealError(query.error) : null;
  if (error) {
    logUpdateSealError(error);
    const notFound = error.code === 'CONTRACT_NOT_FOUND';
    return (
      <div className="bg-brand-cream px-6 py-16" data-testid={notFound ? 'live-candidate-not-found' : 'live-candidate-error'}>
        <div className="max-w-xl mx-auto bg-white border-2 border-brand-charcoal p-8 shadow-[4px_4px_0px_#0B130E] space-y-4">
          <DataModeBadge />
          <h1 className="text-2xl font-black uppercase">{notFound ? 'Package Not Found On-Chain' : 'Package Read Failed'}</h1>
          <p className="text-xs font-mono text-stone-600">
            {notFound
              ? `No UpdateSealRegistry record exists for publisher ${decodedPublisher} and slug ${decodedSlug}.`
              : error.userMessage}
          </p>
          <Link to="/registry" className="block text-xs font-bold uppercase text-brand-orange">
            ← Back to registry
          </Link>
        </div>
      </div>
    );
  }

  const record = query.data?.record;
  if (!record) {
    return null;
  }

  return (
    <LiveCandidateProvider key={record.package_uid} packageRecord={record}>
      <Outlet />
    </LiveCandidateProvider>
  );
};
