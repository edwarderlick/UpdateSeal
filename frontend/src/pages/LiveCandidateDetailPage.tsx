import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { DataModeBadge } from '../components/ui/DataModeBadge';
import { CopyButton } from '../components/ui/CopyButton';
import { useOnChainCandidate, useOnChainPackageByPublisherSlug } from '../features/registry/registryQueries';
import { deriveCandidateId } from '../lib/candidateValidation';
import { getUpdateSealConfigResult, isLiveReadsEnabled } from '../lib/updateSealConfig';
import { livePackagePath } from '../lib/registrationValidation';
import { logUpdateSealError, toUpdateSealError } from '../lib/updateSealErrors';

export const LiveCandidateDetailPage: React.FC = () => {
  const { publisher = '', packageSlug = '', version = '' } = useParams();
  const decodedPublisher = decodeURIComponent(publisher);
  const decodedSlug = decodeURIComponent(packageSlug);
  const decodedVersion = decodeURIComponent(version);
  const configResult = getUpdateSealConfigResult();
  const liveEnabled = isLiveReadsEnabled(configResult);
  const packageQuery = useOnChainPackageByPublisherSlug(decodedPublisher, decodedSlug);
  const packageUid = packageQuery.data?.packageUid;
  const candidateId = packageUid ? deriveCandidateId(packageUid, decodedVersion) : undefined;
  const candidateQuery = useOnChainCandidate(candidateId);

  if (!configResult.ok) {
    return (
      <div className="bg-brand-cream px-6 py-16">
        <div className="max-w-xl mx-auto bg-white border-2 border-brand-charcoal p-8 space-y-3">
          <DataModeBadge />
          <h1 className="text-2xl font-black uppercase">Configuration Error</h1>
          <p className="text-xs font-mono">{configResult.error.userMessage}</p>
        </div>
      </div>
    );
  }

  if (!liveEnabled) {
    return (
      <div className="bg-brand-cream px-6 py-16" data-testid="live-candidate-detail-demo-unavailable">
        <div className="max-w-xl mx-auto bg-white border-2 border-brand-charcoal p-8 space-y-3">
          <DataModeBadge />
          <h1 className="text-2xl font-black uppercase">Live Route Unavailable</h1>
          <p className="text-xs font-mono">Live candidate records are unavailable in demo mode.</p>
          <Link to="/registry" className="text-xs font-bold uppercase text-brand-orange">
            ← Back to registry
          </Link>
        </div>
      </div>
    );
  }

  if (packageQuery.isLoading || candidateQuery.isLoading) {
    return (
      <div className="bg-brand-cream px-6 py-16" data-testid="live-candidate-detail-loading">
        <div className="max-w-[1400px] mx-auto bg-white border-2 border-brand-charcoal p-10 animate-pulse min-h-[240px]" />
      </div>
    );
  }

  const error = (packageQuery.error || candidateQuery.error) ? toUpdateSealError(packageQuery.error ?? candidateQuery.error) : null;
  if (error) {
    logUpdateSealError(error);
    return (
      <div className="bg-brand-cream px-6 py-16" data-testid="live-candidate-detail-error">
        <div className="max-w-xl mx-auto bg-white border-2 border-brand-charcoal p-8 space-y-3">
          <DataModeBadge />
          <h1 className="text-2xl font-black uppercase">Candidate Not Found On-Chain</h1>
          <p className="text-xs font-mono">{error.userMessage}</p>
          <Link to="/registry" className="text-xs font-bold uppercase text-brand-orange">
            ← Back to registry
          </Link>
        </div>
      </div>
    );
  }

  const record = candidateQuery.data;
  const pkg = packageQuery.data?.record;
  if (!record || !pkg) {
    return null;
  }

  return (
    <div className="w-full flex flex-col" data-testid="live-candidate-detail">
      <div className="bg-brand-charcoal text-white px-6 py-2.5 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2 flex-wrap">
          <Link to="/registry" className="text-stone-400 hover:text-white">
            Registry
          </Link>
          <span className="text-stone-500">/</span>
          <Link to={livePackagePath(pkg.publisher, pkg.package_slug)} className="text-brand-pastelYellow">
            {pkg.package_slug}
          </Link>
          <span className="text-stone-500">/</span>
          <span>{record.version}</span>
        </div>
        <DataModeBadge />
      </div>
      <section className="bg-brand-cream px-6 lg:px-12 py-10">
        <div className="max-w-[1400px] mx-auto space-y-6">
          <h1 className="text-3xl font-black uppercase">Candidate record</h1>
          <div className="bg-white border-2 border-brand-charcoal p-6 shadow-[4px_4px_0px_#0B130E] space-y-2 font-mono text-xs">
            <p className="break-all">Candidate ID: {record.candidate_id}</p>
            <p className="break-all">Package UID: {record.package_uid}</p>
            <p>Version: {record.version}</p>
            <p className="break-all">Candidate commit SHA: {record.candidate_commit_sha}</p>
            <p className="break-all">Evidence URI: {record.evidence_uri}</p>
            <p className="break-all flex items-center gap-1">
              Evidence hash: {record.evidence_hash}
              <CopyButton text={record.evidence_hash} />
            </p>
            <p className="break-all">Submitter: {record.submitter}</p>
            <p>Status: {record.status}</p>
            <p>Decision code: {record.decision_code}</p>
            <p>Decision summary: {record.decision_summary || '(empty)'}</p>
            <p>Evaluation attempts: {record.evaluation_attempts}</p>
            {record.status === 'PENDING' && (
              <p className="font-bold">Candidate is PENDING. Evaluation has not started from this record view.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
